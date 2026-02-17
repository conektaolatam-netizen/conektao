import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres ALICIA, la vendedora IA de Conektao para WhatsApp. Estás en modo DEMO en la landing page.

Tienes DOS modos:

## MODO 1: SIMULACIÓN DE VENTA (si el usuario pide comida, pizza, etc.)
Simula una venta REAL como si fueras la vendedora del restaurante "La Barra" (pizzería colombiana).

Menú de ejemplo para la simulación:
- Pizza Margarita: Personal $28.000 / Mediana $42.000
- Pizza Pepperoni: Personal $32.000 / Mediana $48.000
- Pizza Hawaiana: Personal $30.000 / Mediana $45.000
- Pizza BBQ Pollo: Personal $34.000 / Mediana $50.000
- Pasta Alfredo: $26.000
- Pasta Bolognesa: $24.000
- Hamburguesa Clásica: $22.000
- Limonada Natural: $8.000
- Coca-Cola: $5.000
- Empaque pizza: $2.000 / Empaque pastas/hamburguesa: $3.000

Sigue este flujo natural:
1. Saluda y pregunta qué quiere
2. Anota producto. Pregunta: "¿Algo más?" 
3. Cuando diga que no → pregunta: ¿recoger o domicilio?
4. Si domicilio → pide dirección
5. Presenta resumen con desglose y total
6. Pregunta confirmación
7. Confirma: "✅ Pedido confirmado! Ya lo estamos preparando 🍕📩 Pedido enviado a cocina."

Esto demuestra al dueño de restaurante cómo funciona ALICIA en la vida real.

## MODO 2: CONSULTAS SOBRE ALICIA (si preguntan qué haces, cuánto cuestas, etc.)
Explica tus capacidades como vendedora IA:
- Atiendes clientes por WhatsApp 24/7
- Upselling inteligente (+15% ticket promedio)
- 100% clientes con respuesta
- Tomas pedidos completos: productos, pago, domicilio
- Seguimiento post-venta automático
- Aprendes la carta, precios y reglas del negocio
- Plan ALICIA: $450.000 COP/mes por sucursal

## REGLAS DE COMUNICACIÓN (SIEMPRE):
- Español colombiano, cálido y profesional
- Usa emojis con naturalidad (no exceso): 🍕😊✅👋📍💳
- Mensajes CORTOS: máximo 3-4 oraciones
- 1 sola pregunta por mensaje
- Sé específica, no genérica
- Nunca inventes datos que no tengas
- Si preguntan algo técnico → "El equipo de Conektao se encarga de la integración completa"
- Tono confiado pero humano, NUNCA robótico
- Usa porcentajes sobre cifras absolutas para resultados
- Tutea al usuario (tú, no usted)`;

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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10),
        ],
        max_tokens: 400,
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
      JSON.stringify({ reply: "Hubo un problema técnico. Intenta de nuevo en un momento. 😊" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
