import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'employee';
  permissions: any;
  restaurant_id: string;
  created_by: string;
  restaurant_name: string;
  owner_name: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const {
      email,
      password,
      full_name,
      phone,
      role,
      permissions,
      restaurant_id,
      created_by,
      restaurant_name,
      owner_name
    }: CreateEmployeeRequest = await req.json();

    console.log("create-employee payload:", { email, role, restaurant_id });

    // 0) Buscar si ya existe perfil por email (nos da el user_id)
    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileLookupError) {
      console.error('Error looking up profile:', profileLookupError);
    }

    let userId = existingProfile?.id as string | undefined;

    if (userId) {
      // A) Usuario ya existe en el sistema -> actualizamos password y perfil
      console.log('Existing profile found. Updating auth password and profile for', userId);

      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });
      if (updateAuthErr) {
        console.error('Error updating user password:', updateAuthErr);
        // No abortamos; aún así intentamos actualizar el perfil
      }

      const { error: updateProfileErr } = await supabaseAdmin
        .from('profiles')
        .update({
          email,
          full_name,
          phone: phone || null,
          role,
          permissions,
          restaurant_id,
          created_by,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateProfileErr) {
        console.error('Error updating existing profile:', updateProfileErr);
        return new Response(
          JSON.stringify({ error: updateProfileErr.message || 'No se pudo actualizar el perfil existente' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Intento best-effort de email (no bloqueante)
      try {
        const emailResponse = await resend.emails.send({
          from: "Conektao <onboarding@resend.dev>",
          to: [email],
          subject: `Tu acceso a ${restaurant_name} ha sido actualizado`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h2 style="color:#334155;">Acceso actualizado</h2>
              <p>Fuiste asignado a <strong>${restaurant_name}</strong> por <strong>${owner_name}</strong>.</p>
              <p>Tu contraseña fue configurada por el administrador. Ya puedes iniciar sesión con tu email: <strong>${email}</strong>.</p>
            </div>
          `,
          text: `Fuiste asignado a ${restaurant_name}. Tu contraseña fue configurada por el administrador. Email: ${email}`,
        });
        console.log('Notification email (existing user) response:', emailResponse);
      } catch (e) {
        console.warn('Email send skipped/failed (existing user):', e);
      }

      return new Response(
        JSON.stringify({ success: true, user_id: userId, message: 'Empleado actualizado y vinculado al restaurante.' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // B) Usuario NO existe -> crearlo en Auth y registrar/upsert perfil
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError || !authData?.user?.id) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'No se pudo crear el usuario en Auth' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    userId = authData.user.id;

    // Upsert de perfil para evitar violación de PK si ya existe
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        phone: phone || null,
        role,
        permissions,
        restaurant_id,
        created_by,
        is_active: true,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (upsertErr) {
      console.error('Error upserting profile:', upsertErr);
      // Si falla el perfil, revertimos el usuario creado
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: upsertErr.message || 'No se pudo crear el perfil' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Intento best-effort de email (no bloqueante)
    try {
      const emailResponse = await resend.emails.send({
        from: "Conektao <onboarding@resend.dev>",
        to: [email],
        subject: `Te han añadido como empleado en ${restaurant_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h1 style="color: #2563eb; margin: 0 0 16px;">¡Bienvenido!</h1>
            <p>Has sido añadido a <strong>${restaurant_name}</strong> por <strong>${owner_name}</strong> como ${role === 'admin' ? 'Administrador' : 'Empleado'}.</p>
            <p>Puedes iniciar sesión con tu email: <strong>${email}</strong> y la contraseña asignada por tu administrador.</p>
          </div>
        `,
        text: `Bienvenido a ${restaurant_name}. Email: ${email}. Tu administrador te compartirá la contraseña.`,
      });
      console.log('Notification email (new user) response:', emailResponse);
    } catch (e) {
      console.warn('Email send skipped/failed (new user):', e);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, message: 'Empleado creado exitosamente.' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in create-employee function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
