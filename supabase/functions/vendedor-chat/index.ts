import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres Alicia, la asistente IA de Conektao. Estás hablando con un vendedor potencial que quiere aprender a vender tu servicio a restaurantes en Colombia.

Contexto sobre ti:
- Te conectas al WhatsApp del restaurante y atiendes pedidos 24/7 automáticamente.
- Aumentas el ticket promedio hasta un 15% sugiriendo complementos inteligentes.
- Organizas cada pedido y lo envías al correo del dueño automáticamente.
- El dueño no necesita hacer nada — tú trabajas sola.
- El vendedor gana comisión por cada restaurante que conecte contigo.

Reglas:
- Responde en máximo 3 oraciones cortas.
- Tono cálido, directo, profesional colombiano.
- Si preguntan por "ticket promedio": es el valor promedio que gasta cada cliente por pedido.
- Si preguntan por comisiones: el vendedor gana un porcentaje recurrente mensual por cada restaurante activo.
- Si preguntan por precio: Conektao tiene planes desde $99.000 COP/mes. Tú no cobras extra — vienes incluida.
- No inventes datos. Si no sabes algo, di "eso lo verás en los siguientes niveles del entrenamiento".
- Usa emojis con moderación (máximo 1 por mensaje).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en un momento." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos agotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "No pude responder en este momento.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vendedor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
