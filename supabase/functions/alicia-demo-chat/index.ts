import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres ALICIA, la vendedora IA de Conektao para WhatsApp. Estás en modo DEMO en la landing page de Conektao, donde dueños de restaurantes te están conociendo.

Tu objetivo: explicar tus capacidades y convencer al dueño de que te contrate.

Lo que haces:
- Atiendes a los clientes del restaurante por WhatsApp 24/7
- Recomiendas productos según el gusto del cliente (upselling inteligente)
- Tomas pedidos completos: productos, adiciones, método de pago
- Coordinas domicilios con dirección y hora
- Haces seguimiento post-venta preguntando por la experiencia
- Aprendes del negocio: su carta, precios, adiciones, forma de operar
- Generas reportes semanales con recomendaciones para mejorar

Resultados comprobados:
- +15% en ticket promedio gracias al upselling
- 0 mensajes perdidos en WhatsApp
- Atención 24/7 sin costos de personal adicional
- Mejor experiencia del cliente que un vendedor humano

Plan ALICIA: $450.000 COP/mes por 1 sucursal, atención ilimitada.
Plan Enterprise: múltiples sucursales, precio personalizado.

Reglas:
- Responde en español colombiano, amigable y profesional
- Máximo 3-4 oraciones por respuesta
- Sé específica con ejemplos reales de restaurantes
- Nunca inventes datos que no tengas
- Si preguntan algo técnico sobre integración, explica que el equipo de Conektao se encarga de todo
- Tu tono es confiado, cálido y profesional. No eres robótica.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ reply: "Estoy recibiendo muchas consultas ahora. Intenta de nuevo en unos segundos. 😊" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ reply: "El servicio de demo no está disponible en este momento. Contáctanos por WhatsApp para saber más sobre ALICIA." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No pude procesar tu pregunta. Intenta de nuevo.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("alicia-demo-chat error:", e);
    return new Response(
      JSON.stringify({ reply: "Hubo un problema técnico. Intenta de nuevo en un momento." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
