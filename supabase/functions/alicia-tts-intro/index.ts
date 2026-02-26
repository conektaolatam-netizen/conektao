import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Modified script: includes the "ticket promedio" question for branching
const SCRIPT = `Hola. Soy Alicia. Trabajo para restaurantes en Colombia las 24 horas del día, los 7 días de la semana. Me conecto directamente al WhatsApp del restaurante. Ahí recibo pedidos, respondo preguntas y atiendo clientes, sin que el dueño tenga que hacer nada. Cada conversación que atiendo puede aumentar el valor de cada pedido hasta un quince por ciento. ¿Sabes qué es el ticket promedio? ... Eso significa más dinero para el restaurante, sin contratar a nadie. Y cuando el restaurante recibe un pedido, yo lo organizo y lo envío automáticamente al correo del dueño. Todo queda registrado, sin errores, sin papeles. Eso soy yo. Una sola herramienta que conecta WhatsApp con el correo del restaurante, aumenta las ventas y trabaja mientras el dueño duerme. Ahora ya me conoces. En el siguiente nivel vas a aprender exactamente cómo presentarme a un restaurante en menos de un minuto.`;

const VOICE_ID = "FGY2WhTYpPnrIDTdsKH5"; // Laura

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: SCRIPT,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.75,
            style: 0.25,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const t = await res.text();
      console.error("ElevenLabs error:", res.status, t);
      return new Response(JSON.stringify({ error: "TTS generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    console.error("alicia-tts-intro error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
