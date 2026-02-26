import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCRIPT = `El ticket promedio es el valor promedio que gasta cada cliente en un pedido. Por ejemplo, si diez personas piden y en total gastan quinientos mil pesos, el ticket promedio es cincuenta mil pesos. Yo lo subo sugiriendo productos adicionales en cada conversación. Como cuando una persona pide una hamburguesa y yo le pregunto si quiere papas o una bebida. Eso sube el total sin que el dueño haga nada.`;

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
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true, speed: 1.0 },
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
    console.error("alicia-tts-ticket error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
