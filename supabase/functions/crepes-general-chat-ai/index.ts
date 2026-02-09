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
      manager: "Carolina Mendoza",
      branches: 5,
      salesToday: 20100000,
      salesYesterday: 74000000,
      auditScore: 81,
      alerts: ["San Martín: score 62%, 3 ausencias, errores de preparación"],
      posErrors: { voidsSuspicious: 7, discountsNoAuth: 3, cashDiff: 185000, kitchenCancels: 4 },
      staffIssues: { lateArrivals: 2, absences: 3, overtime: 14 },
    },
    "bogota-sur": {
      name: "Bogotá Sur",
      manager: "Andrea López",
      branches: 4,
      salesToday: 15200000,
      salesYesterday: 58000000,
      auditScore: 85,
      alerts: [],
      posErrors: { voidsSuspicious: 1, discountsNoAuth: 0, cashDiff: 0, kitchenCancels: 2 },
      staffIssues: { lateArrivals: 1, absences: 0, overtime: 6 },
    },
    "bogota-centro": {
      name: "Bogotá Centro",
      manager: "Valentina Herrera",
      branches: 3,
      salesToday: 11800000,
      salesYesterday: 45000000,
      auditScore: 88,
      alerts: ["Calle 90: score 71%, tiempo de servicio 16min promedio"],
      posErrors: { voidsSuspicious: 3, discountsNoAuth: 1, cashDiff: 42000, kitchenCancels: 6 },
      staffIssues: { lateArrivals: 0, absences: 1, overtime: 8 },
    },
    "medellin": {
      name: "Medellín",
      manager: "Juliana Restrepo",
      branches: 6,
      salesToday: 24500000,
      salesYesterday: 89000000,
      auditScore: 90,
      alerts: [],
      posErrors: { voidsSuspicious: 0, discountsNoAuth: 0, cashDiff: 0, kitchenCancels: 1 },
      staffIssues: { lateArrivals: 0, absences: 0, overtime: 3 },
    },
    "cali": {
      name: "Cali",
      manager: "Marcela Caicedo",
      branches: 4,
      salesToday: 14800000,
      salesYesterday: 56000000,
      auditScore: 86,
      alerts: [],
      posErrors: { voidsSuspicious: 2, discountsNoAuth: 1, cashDiff: 75000, kitchenCancels: 3 },
      staffIssues: { lateArrivals: 1, absences: 0, overtime: 5 },
    },
    "eje-cafetero": {
      name: "Eje Cafetero",
      manager: "Natalia Giraldo",
      branches: 4,
      salesToday: 9200000,
      salesYesterday: 38000000,
      auditScore: 68,
      alerts: [
        "Pereira: score 58%, 4 empleadas ausentes, inventario crítico en 6 productos",
        "Armenia: score 65%, errores de preparación recurrentes, diferencia de caja $320,000",
      ],
      posErrors: { voidsSuspicious: 14, discountsNoAuth: 8, cashDiff: 520000, kitchenCancels: 11 },
      staffIssues: { lateArrivals: 6, absences: 4, overtime: 28 },
    },
    "costa": {
      name: "Costa Caribe",
      manager: "María Fernanda Marín",
      branches: 5,
      salesToday: 18300000,
      salesYesterday: 67000000,
      auditScore: 83,
      alerts: [],
      posErrors: { voidsSuspicious: 3, discountsNoAuth: 2, cashDiff: 95000, kitchenCancels: 2 },
      staffIssues: { lateArrivals: 2, absences: 1, overtime: 10 },
    },
    "santanderes": {
      name: "Santanderes",
      manager: "Lucía Pardo",
      branches: 3,
      salesToday: 9600000,
      salesYesterday: 36000000,
      auditScore: 87,
      alerts: [],
      posErrors: { voidsSuspicious: 1, discountsNoAuth: 0, cashDiff: 0, kitchenCancels: 1 },
      staffIssues: { lateArrivals: 0, absences: 0, overtime: 4 },
    },
  },
  criticalBranches: [
    {
      name: "Crepes & Waffles Pereira",
      region: "Eje Cafetero",
      score: 58,
      issues: ["4 empleadas ausentes sin justificación", "6 productos bajo mínimo", "NPS: 72%", "12 errores de preparación esta semana"],
      posDetail: "14 anulaciones sospechosas en 3 días. 8 descuentos sin autorización. Una cajera del turno tarde concentra 9 de las 14 anulaciones. Patrón detectado: anulaciones justo antes de cierre de caja.",
    },
    {
      name: "Crepes & Waffles Armenia",
      region: "Eje Cafetero",
      score: 65,
      issues: ["9 errores de preparación esta semana", "Diferencia de caja: $320,000 COP", "Tiempo de servicio: 18 min promedio"],
      posDetail: "Diferencia de caja concentrada en turno mañana (misma cajera 3 días seguidos). 5 órdenes canceladas después de preparadas. Desperdicio estimado: $180,000 COP en ingredientes.",
    },
    {
      name: "Crepes & Waffles Calle 90",
      region: "Bogotá Centro",
      score: 71,
      issues: ["Tiempo de servicio: 16 min", "2 reclamos por demora", "3 renuncias este mes"],
      posDetail: "Ticket promedio cayó 12% vs mes pasado ($34,200 vs $38,900). 3 empleadas nuevas en curva de aprendizaje. Ventas por empleada 22% por debajo de la media regional.",
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
    totalVoidsSuspicious: 31,
    totalCashDifference: 917000,
    totalKitchenCancels: 30,
    topPerformer: "Juliana Restrepo (Medellín) — 0 errores POS, score 90%, ventas por empleada más altas del país",
    worstPerformer: "Pereira turno tarde — 1 cajera con 9 anulaciones sospechosas concentradas antes de cierre",
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
      .map((r: any) => `
📍 ${r.name} (Gerente: ${r.manager}):
- ${r.branches} sucursales | Ventas hoy: $${r.salesToday.toLocaleString()} COP | Ayer: $${r.salesYesterday.toLocaleString()} COP
- Score auditoría: ${r.auditScore}%
- POS: ${r.posErrors.voidsSuspicious} anulaciones sospechosas, ${r.posErrors.discountsNoAuth} descuentos no autorizados, diferencia caja $${r.posErrors.cashDiff.toLocaleString()}, ${r.posErrors.kitchenCancels} cancelaciones cocina
- Personal: ${r.staffIssues.lateArrivals} llegadas tarde, ${r.staffIssues.absences} ausencias, ${r.staffIssues.overtime}h extras
${r.alerts.length > 0 ? `⚠️ Alertas: ${r.alerts.join('; ')}` : '✅ Sin alertas'}`)
      .join('\n');

    const criticalSummary = nationalData.criticalBranches
      .map((b) => `🔴 ${b.name} (${b.region}) — Score: ${b.score}%\n   Problemas: ${b.issues.join(', ')}\n   Análisis POS: ${b.posDetail}`)
      .join('\n\n');

    const kpis = nationalData.nationalKPIs;

    const systemPrompt = `Eres Conektao AI, el copiloto ejecutivo de inteligencia de negocios del Gerente General de Crepes & Waffles.
El Gerente General se llama Rodrigo. Trátalo con cercanía colombiana pero siendo directo y preciso.

CONTEXTO CULTURAL IMPORTANTE:
- En Crepes & Waffles TODAS las gerentes regionales son mujeres. Refiérete a ellas siempre en femenino: "la gerente", "ella", "su equipo".
- La gran mayoría de empleadas también son mujeres. Usa femenino por defecto: "las empleadas", "las cajeras", "las meseras".
- Solo usa masculino cuando te refieras a Rodrigo u otro hombre específico.

DATOS NACIONALES EN TIEMPO REAL:
🏢 ${nationalData.totalBranches} sucursales en ${nationalData.totalRegions} regiones
💰 Ventas hoy: $${kpis.totalSalesToday.toLocaleString()} COP | Ayer: $${kpis.totalSalesYesterday.toLocaleString()} COP
💰 Semana: $${kpis.totalSalesWeek.toLocaleString()} COP (${kpis.salesChangeWeek}% vs semana pasada) | Mes: $${kpis.totalSalesMonth.toLocaleString()} COP
📦 ${kpis.totalOrders} pedidos hoy | Ticket: $${kpis.avgTicket.toLocaleString()} COP
🏥 Score auditoría nacional: ${kpis.avgAuditScore}% | NPS: ${kpis.nps}
👥 Personal: ${kpis.staffPresent}/${kpis.staffTotal} presentes (${Math.round((kpis.staffPresent/kpis.staffTotal)*100)}%)
🛵 Domicilios: ${kpis.deliveryPercent}%

DETECCIÓN DE ERRORES Y ANOMALÍAS (esto es lo que impresiona a Rodrigo):
🚨 Total anulaciones sospechosas nacional: ${kpis.totalVoidsSuspicious} esta semana
🚨 Diferencia de caja acumulada: $${kpis.totalCashDifference.toLocaleString()} COP
🚨 Cancelaciones de cocina: ${kpis.totalKitchenCancels}
🏆 Mejor rendimiento: ${kpis.topPerformer}
⚠️ Peor señal: ${kpis.worstPerformer}

DETALLE POR REGIÓN:
${regionSummaries}

SUCURSALES CRÍTICAS (análisis profundo):
${criticalSummary}

REGLAS DE RESPUESTA (OBLIGATORIAS):
1. PROHIBIDO usar asteriscos, negritas, markdown o cualquier formato técnico. Solo texto limpio con emojis.
2. Usa emojis al inicio de cada bloque para dar estructura visual: 📊 💡 🎯 ⚠️ 🔥 💰 👥 🏢 📈 📉
3. Tu superpoder es DETECTAR PATRONES que un humano no ve fácilmente. Cruza datos de POS + personal + ventas para encontrar correlaciones. Ejemplos:
   — "En Pereira, 1 cajera concentra el 64% de las anulaciones y todas ocurren antes de cierre. Eso no es error, es un patrón."
   — "Armenia pierde $320,000 en caja y $180,000 en desperdicio por cancelaciones. Son $500,000 diarios que se van."
   — "Calle 90 perdió 3 empleadas y el ticket promedio cayó 12%. La rotación está costando ventas."
4. Sé conciso y brutal con los datos. Máximo 3-4 bloques. Rodrigo no lee novelas.
5. Tono: colombiano directo. "Rodrigo, ojo con esto" no "Estimado señor gerente".
6. Si no tienes un dato exacto, estima basándote en tendencias y dilo claramente.
7. NUNCA uses frases genéricas motivacionales ni felicitaciones vacías.
8. Cada respuesta debe tener al menos UN insight que haga decir "wow, no había visto eso". Cruza datos, detecta patrones, calcula pérdidas ocultas.
9. PROHIBIDO usar la palabra "salón" — di "mesas". PROHIBIDO "caldos" — di "sopas".
10. Cuando hables de una gerente regional, SIEMPRE usa femenino. Ejemplo: "Natalia está teniendo problemas en su región" no "el gerente tiene problemas".`;

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
