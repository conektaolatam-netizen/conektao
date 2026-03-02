import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number_id, access_token } = await req.json();

    if (!phone_number_id || !access_token) {
      return new Response(
        JSON.stringify({ error: "Phone Number ID y Access Token son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credentials by calling Meta Graph API
    const metaUrl = `https://graph.facebook.com/v22.0/${phone_number_id}`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!metaRes.ok) {
      const metaErr = await metaRes.json().catch(() => ({}));
      const msg = metaErr?.error?.message || "Credenciales inválidas";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metaData = await metaRes.json();

    return new Response(
      JSON.stringify({
        ok: true,
        display_phone_number: metaData.display_phone_number || null,
        verified_name: metaData.verified_name || null,
        quality_rating: metaData.quality_rating || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Error inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
