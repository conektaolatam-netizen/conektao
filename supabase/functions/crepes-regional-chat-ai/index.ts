import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const regionalData = {
  region: "Bogotá Norte",
  manager: "Carlos Mendoza",
  branches: {
    "zona-t": {
      name: "Crepes & Waffles Zona T",
      todaySales: 4300000,
      yesterdaySales: 16200000,
      ordersToday: 127,
      avgTicket: 33858,
      staffPresent: 8,
      staffTotal: 10,
      auditScore: 87,
      topProduct: "Crepe de Nutella",
      deliveryPercent: 35,
      satisfaction: 94,
      issues: [],
      aiRecommendation: "Día lluvioso previsto mañana. Sugerir reforzar domicilios y preparar promoción de bebidas calientes.",
    },
    "andino": {
      name: "Crepes & Waffles Andino",
      todaySales: 5800000,
      yesterdaySales: 18500000,
      ordersToday: 156,
      avgTicket: 37179,
      staffPresent: 12,
      staffTotal: 12,
      auditScore: 92,
      topProduct: "Waffle Belga",
      deliveryPercent: 20,
      satisfaction: 96,
      issues: [],
      aiRecommendation: "Mejor desempeño de la región. Ticket promedio alto gracias a upselling efectivo del equipo.",
    },
    "unicentro": {
      name: "Crepes & Waffles Unicentro",
      todaySales: 3100000,
      yesterdaySales: 12800000,
      ordersToday: 89,
      avgTicket: 34831,
      staffPresent: 7,
      staffTotal: 9,
      auditScore: 78,
      topProduct: "Helado Triple",
      deliveryPercent: 42,
      satisfaction: 88,
      issues: ["Tiempo de servicio elevado (14 min promedio)"],
      aiRecommendation: "Tiempo de servicio alto. Revisar rotación de turnos y considerar apoyo en horas pico (12-14h).",
    },
    "san-martin": {
      name: "Crepes & Waffles San Martín",
      todaySales: 2800000,
      yesterdaySales: 11200000,
      ordersToday: 78,
      avgTicket: 35897,
      staffPresent: 6,
      staffTotal: 9,
      auditScore: 62,
      topProduct: "Crepe Stroganoff",
      deliveryPercent: 28,
      satisfaction: 79,
      issues: [
        "3 empleados ausentes sin justificación",
        "Inventario de frutas frescas con 4 ítems bajo mínimo",
        "8 errores de preparación registrados esta semana",
        "Diferencia de caja de $185,000 el martes"
      ],
      aiRecommendation: "ALERTA: Múltiples problemas operativos. Requiere visita presencial urgente. Priorizar: personal ausente y errores de preparación.",
    },
    "santa-fe": {
      name: "Crepes & Waffles Santafé",
      todaySales: 4100000,
      yesterdaySales: 15300000,
      ordersToday: 112,
      avgTicket: 36607,
      staffPresent: 9,
      staffTotal: 10,
      auditScore: 84,
      topProduct: "Crepe de Pollo",
      deliveryPercent: 30,
      satisfaction: 91,
      issues: ["1 reclamo de cliente por demora en domicilio"],
      aiRecommendation: "Operación estable. Monitorear tiempos de domicilio, se detectó 1 reclamo hoy.",
    },
  },
  totalSalesRegion: 20100000,
  totalSalesYesterday: 74000000,
  totalOrders: 562,
  avgRegionalScore: 81,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const branchSummaries = Object.values(regionalData.branches)
      .map((b) => `
📍 ${b.name}:
- Ventas hoy: $${b.todaySales.toLocaleString()} COP | Ayer: $${b.yesterdaySales.toLocaleString()} COP
- Pedidos: ${b.ordersToday} | Ticket promedio: $${b.avgTicket.toLocaleString()} COP
- Personal: ${b.staffPresent}/${b.staffTotal} presentes
- Score auditoría: ${b.auditScore}% | Satisfacción: ${b.satisfaction}%
- Producto estrella: ${b.topProduct}
- Domicilios: ${b.deliveryPercent}%
${b.issues.length > 0 ? `⚠️ Problemas: ${b.issues.join('; ')}` : '✅ Sin alertas'}
- Recomendación IA: ${b.aiRecommendation}`)
      .join('\n');

    const systemPrompt = `Eres Conektao AI, el asistente de inteligencia de negocios para el Gerente Regional de Crepes & Waffles.
Región: ${regionalData.region}
Gerente: ${regionalData.manager}
Sucursales a cargo: ${Object.keys(regionalData.branches).length}

DATOS REGIONALES EN TIEMPO REAL:
💰 Ventas totales hoy: $${regionalData.totalSalesRegion.toLocaleString()} COP
💰 Ventas totales ayer: $${regionalData.totalSalesYesterday.toLocaleString()} COP
📦 Pedidos totales hoy: ${regionalData.totalOrders}
🏥 Score auditoría regional promedio: ${regionalData.avgRegionalScore}%

DETALLE POR SUCURSAL:
${branchSummaries}

INSTRUCCIONES DE FORMATO Y ESTILO:
1. Responde con datos específicos de la región y sus sucursales. Si no tienes un dato exacto, estima basándote en tendencias disponibles.
2. NUNCA uses asteriscos (**) ni markdown. Usa emojis para estructura: 📊 📈 📉 💡 ⚠️ ✅ 🎯 🔥 💰 👥 📍
3. Sé conciso. Máximo 3-4 bloques cortos. El gerente regional está en movimiento.
4. Destaca problemas críticos proactivamente (San Martín score 62%).
5. Si preguntan algo fuera de los datos, responde con estimaciones lógicas. SIEMPRE responde, nunca digas "no tengo ese dato".
6. Español colombiano profesional. Directo y práctico.
7. Si detectas patrones entre sucursales, menciónalo.
8. Formato: emojis al inicio de cada punto, texto limpio. Nada de listas interminables.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de uso alcanzado. Intenta de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error al conectar con la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in crepes-regional-chat-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
