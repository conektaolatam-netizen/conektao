import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generarCodigo(nombre: string): string {
  const limpio = nombre.replace(/\s+/g, "").toUpperCase();
  const prefijo = limpio.substring(0, 6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${prefijo}CONEK${random}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { nombre, correo, whatsapp } = await req.json();

    if (!nombre || !correo || !whatsapp) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: nombre, correo y whatsapp son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codigo = generarCodigo(nombre);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("vendedores_agente").insert({
      nombre: nombre.trim(),
      correo: correo.trim(),
      whatsapp: whatsapp.trim(),
      codigo_vendedor: codigo,
      estado: "pre-registrado",
    }).select("id, codigo_vendedor").single();

    if (error) {
      console.error("Error insertando vendedor:", error);
      return new Response(
        JSON.stringify({ error: "No se pudo registrar el vendedor", detail: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        codigo_vendedor: data.codigo_vendedor,
        vendedor_id: data.id,
        message: `Vendedor registrado exitosamente con código ${data.codigo_vendedor}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error general:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
