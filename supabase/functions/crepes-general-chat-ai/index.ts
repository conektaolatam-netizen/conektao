import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const nationalData = {
  company: "Crepes & Waffles",
  ceo: "Rodrigo",
  totalBranches: 42,
  totalRegions: 8,
  regions: {
    "bogota-norte": {
      name: "Bogotá Norte",
      manager: "Carlos Mendoza",
      branches: 5,
      salesToday: 20100000,
      salesYesterday: 74000000,
      auditScore: 81,
      alerts: ["San Martín: score 62%, 3 ausencias, errores de preparación"],
    },
    "bogota-sur": {
      name: "Bogotá Sur",
      manager: "Andrea López",
      branches: 4,
      salesToday: 15200000,
      salesYesterday: 58000000,
      auditScore: 85,
      alerts: [],
    },
    "bogota-centro": {
      name: "Bogotá Centro",
      manager: "Felipe Herrera",
      branches: 3,
      salesToday: 11800000,
      salesYesterday: 45000000,
      auditScore: 88,
      alerts: ["Calle 90: score 71%, tiempo de servicio 16min promedio"],
    },
    "medellin": {
      name: "Medellín",
      manager: "Juliana Restrepo",
      branches: 6,
      salesToday: 24500000,
      salesYesterday: 89000000,
      auditScore: 90,
      alerts: [],
    },
    "cali": {
      name: "Cali",
      manager: "Roberto Caicedo",
      branches: 4,
      salesToday: 14800000,
      salesYesterday: 56000000,
      auditScore: 86,
      alerts: [],
    },
    "eje-cafetero": {
      name: "Eje Cafetero",
      manager: "Natalia Giraldo",
      branches: 4,
      salesToday: 9200000,
      salesYesterday: 38000000,
      auditScore: 68,
      alerts: [
        "Pereira: score 58%, 4 empleados ausentes, inventario crítico en 6 productos",
        "Armenia: score 65%, errores de preparación recurrentes, diferencia de caja $320,000",
      ],
    },
    "costa": {
      name: "Costa Caribe",
      manager: "Andrés Marín",
      branches: 5,
      salesToday: 18300000,
      salesYesterday: 67000000,
      auditScore: 83,
      alerts: [],
    },
    "santanderes": {
      name: "Santanderes",
      manager: "Lucía Pardo",
      branches: 3,
      salesToday: 9600000,
      salesYesterday: 36000000,
      auditScore: 87,
      alerts: [],
    },
  },
  criticalBranches: [
    {
      name: "Crepes & Waffles Pereira",
      region: "Eje Cafetero",
      score: 58,
      issues: ["4 empleados ausentes sin justificación", "6 productos de inventario bajo mínimo", "Satisfacción del cliente: 72%", "12 errores de preparación esta semana"],
    },
    {
      name: "Crepes & Waffles Armenia",
      region: "Eje Cafetero",
      score: 65,
      issues: ["Errores de preparación recurrentes (9 esta semana)", "Diferencia de caja de $320,000 COP", "Tiempo de servicio: 18 min promedio"],
    },
    {
      name: "Crepes & Waffles Calle 90",
      region: "Bogotá Centro",
      score: 71,
      issues: ["Tiempo de servicio elevado (16 min)", "2 reclamos de clientes por demora", "Rotación de personal alta: 3 renuncias este mes"],
    },
  ],
  nationalKPIs: {
    totalSalesToday: 123500000,
    totalSalesYesterday: 463000000,
    totalSalesWeek: 2850000000,
    totalSalesMonth: 11200000000,
    avgTicket: 38500,
    totalOrders: 3208,
    avgAuditScore: 84,
    nps: 89,
    staffTotal: 1260,
    staffPresent: 1187,
    deliveryPercent: 32,
    salesChangeWeek: -3.5,
  },
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

    const regionSummaries = Object.values(nationalData.regions)
      .map((r) => `
📍 ${r.name} (${r.manager}):
- ${r.branches} sucursales | Ventas hoy: $${r.salesToday.toLocaleString()} COP | Ayer: $${r.salesYesterday.toLocaleString()} COP
- Score auditoría: ${r.auditScore}%
${r.alerts.length > 0 ? `⚠️ Alertas: ${r.alerts.join('; ')}` : '✅ Sin alertas'}`)
      .join('\n');

    const criticalSummary = nationalData.criticalBranches
      .map((b) => `🔴 ${b.name} (${b.region}) - Score: ${b.score}%\n   Problemas: ${b.issues.join(', ')}`)
      .join('\n');

    const kpis = nationalData.nationalKPIs;

    const systemPrompt = `Eres Conektao AI, el asistente ejecutivo de inteligencia de negocios del Gerente General de Crepes & Waffles.
El Gerente General se llama Rodrigo. Trátalo con cercanía pero profesionalismo. Usa un tono colombiano cálido y directo.

DATOS NACIONALES EN TIEMPO REAL:
🏢 Total sucursales: ${nationalData.totalBranches} en ${nationalData.totalRegions} regiones
💰 Ventas hoy: $${kpis.totalSalesToday.toLocaleString()} COP
💰 Ventas ayer: $${kpis.totalSalesYesterday.toLocaleString()} COP
💰 Ventas semana: $${kpis.totalSalesWeek.toLocaleString()} COP
💰 Ventas mes: $${kpis.totalSalesMonth.toLocaleString()} COP
📊 Cambio semanal: ${kpis.salesChangeWeek}%
📦 Pedidos hoy: ${kpis.totalOrders} | Ticket promedio: $${kpis.avgTicket.toLocaleString()} COP
🏥 Score auditoría promedio nacional: ${kpis.avgAuditScore}%
😊 NPS: ${kpis.nps}
👥 Personal: ${kpis.staffPresent}/${kpis.staffTotal} presentes (${Math.round((kpis.staffPresent/kpis.staffTotal)*100)}%)
🛵 Domicilios: ${kpis.deliveryPercent}%

DETALLE POR REGIÓN:
${regionSummaries}

SUCURSALES CRÍTICAS:
${criticalSummary}

INSTRUCCIONES DE FORMATO Y ESTILO:
1. Siempre responde con datos concretos. Si no tienes un dato exacto, estima basándote en tendencias y dilo: "estimado según tendencia".
2. NUNCA uses asteriscos (**) ni markdown. Usa emojis para dar estructura: 📊 📈 📉 💡 ⚠️ ✅ 🎯 🔥 💰 👥 🏢
3. Sé conciso. Máximo 3-4 bloques cortos. Rodrigo no tiene tiempo para leer novelas.
4. Tono: colombiano profesional cercano. "Rodrigo, ¡ojo con el Eje Cafetero!" no "Estimado señor gerente".
5. Las ventas han bajado 3.5% esta semana — esto es crítico, menciónalo si es relevante.
6. El Eje Cafetero es la región más problemática (Pereira 58% y Armenia 65%).
7. Si Rodrigo pregunta algo fuera de los datos, responde con estimaciones lógicas. SIEMPRE responde, nunca digas "no tengo ese dato".
8. Nunca uses frases genéricas motivacionales. Solo datos y acciones concretas.
9. Formato: emojis al inicio de cada punto, texto limpio después. Nada de listas largas.`;

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
      return new Response(
        JSON.stringify({ error: "Error al conectar con la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in crepes-general-chat-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
