import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateCredentialsRequest {
  employee_id: string;
  new_email?: string;
  new_password?: string;
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

    const { employee_id, new_email, new_password }: UpdateCredentialsRequest = await req.json();

    console.log("update-employee-credentials payload:", { employee_id, new_email: new_email ? '[PROVIDED]' : null, new_password: new_password ? '[PROVIDED]' : null });

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id es requerido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!new_email && !new_password) {
      return new Response(
        JSON.stringify({ error: 'Debes proporcionar un nuevo email o contraseña' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar que el empleado existe
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', employee_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Empleado no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const updateData: { email?: string; password?: string } = {};
    
    if (new_email && new_email !== profile.email) {
      // Verificar que el nuevo email no esté en uso
      const { data: existingEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', new_email)
        .neq('id', employee_id)
        .maybeSingle();

      if (existingEmail) {
        return new Response(
          JSON.stringify({ error: 'Este email ya está en uso por otro usuario' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      updateData.email = new_email;
    }

    if (new_password) {
      if (new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      updateData.password = new_password;
    }

    // Actualizar en Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      employee_id,
      updateData
    );

    if (authError) {
      console.error('Error updating auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message || 'No se pudo actualizar las credenciales' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Si se actualizó el email, actualizar también en profiles
    if (updateData.email) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          email: updateData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee_id);

      if (profileUpdateError) {
        console.error('Error updating profile email:', profileUpdateError);
        // No es crítico, el auth ya se actualizó
      }
    }

    console.log('Credentials updated successfully for:', employee_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credenciales actualizadas correctamente',
        updated: {
          email: !!updateData.email,
          password: !!updateData.password
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in update-employee-credentials function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
