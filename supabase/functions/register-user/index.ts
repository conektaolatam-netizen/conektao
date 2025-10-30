// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, phone, account_type } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email y contraseña son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Crear usuario confirmado inmediatamente
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name ?? null,
        phone: phone ?? null,
        account_type: account_type ?? "restaurant",
      },
    });

    if (createErr) {
      return new Response(
        JSON.stringify({ error: createErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = created.user;

    // Asegurar perfil con rol inicial (owner por defecto)
    if (user) {
      const role = "owner"; // Mantener roles válidos del sistema
      const { error: upsertErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: email,
          full_name: full_name ?? user.email?.split("@")[0] ?? "Usuario",
          phone: phone ?? null,
          role,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (upsertErr) {
        // Si el perfil falla, devolver error pero el usuario ya quedó creado/confirmado
        return new Response(
          JSON.stringify({ error: upsertErr.message, userId: user.id }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, userId: user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "Error inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});