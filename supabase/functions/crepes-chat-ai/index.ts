import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simulated branch data for contextual responses
const branchData = {
  "zona-t": {
    name: "Sucursal Zona T",
    city: "Bogotá",
    todaySales: 4250000,
    yesterdaySales: 3890000,
    weekSales: 28750000,
    monthSales: 112500000,
    ordersToday: 127,
    averageTicket: 33465,
    topProducts: [
      { name: "Crepe de Nutella", quantity: 45, revenue: 765000 },
      { name: "Waffle Belga", quantity: 38, revenue: 684000 },
      { name: "Helado Triple", quantity: 32, revenue: 416000 },
      { name: "Crepe Stroganoff", quantity: 28, revenue: 560000 },
      { name: "Limonada Natural", quantity: 52, revenue: 364000 },
    ],
    lowProducts: [
      { name: "Crepe de Pollo", quantity: 12, expected: 18, variance: -33 },
      { name: "Helado de Pistacho", quantity: 8, expected: 15, variance: -47 },
      { name: "Crepe de Pollo y Champiñones", quantity: 5, expected: 10, variance: -50 },
    ],
    staffActive: 8,
    staffTotal: 10,
    averageLateness: 12,
    customerSatisfaction: 94,
    deliveryPercentage: 35,
    dineInPercentage: 65,
    peakHours: ["12:00-14:00", "19:00-21:00"],
    comparisons: {
      vsYesterday: 9.2,
      vsLastWeek: 5.5,
      vsLastMonth: 12.3,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, branch_id = "zona-t" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const branch = branchData[branch_id as keyof typeof branchData] || branchData["zona-t"];

    const systemPrompt = `Eres Conektao AI, el asistente de inteligencia de negocios para la ${branch.name} de Crepes & Waffles en ${branch.city}.

DATOS EN TIEMPO REAL DE LA SUCURSAL (usa estos datos para responder):

📊 VENTAS:
- Ventas hoy: $${branch.todaySales.toLocaleString()} COP
- Ventas ayer: $${branch.yesterdaySales.toLocaleString()} COP  
- Ventas semana: $${branch.weekSales.toLocaleString()} COP
- Ventas mes: $${branch.monthSales.toLocaleString()} COP
- Pedidos hoy: ${branch.ordersToday}
- Ticket promedio: $${branch.averageTicket.toLocaleString()} COP
- Comparado con ayer: ${branch.comparisons.vsYesterday > 0 ? '+' : ''}${branch.comparisons.vsYesterday}%
- Comparado con semana pasada: ${branch.comparisons.vsLastWeek > 0 ? '+' : ''}${branch.comparisons.vsLastWeek}%

🍽️ PRODUCTOS MÁS VENDIDOS HOY:
${branch.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} unidades ($${p.revenue.toLocaleString()})`).join('\n')}

📉 PRODUCTOS CON BAJA ROTACIÓN:
${branch.lowProducts.map(p => `- ${p.name}: ${p.quantity} vendidos (esperado: ${p.expected}, ${p.variance}%)`).join('\n')}

👥 PERSONAL:
- Personal activo: ${branch.staffActive}/${branch.staffTotal}
- Puntualidad: llegando ${branch.averageLateness} min tarde en promedio

📱 CANALES:
- Domicilios: ${branch.deliveryPercentage}%
- Mesa: ${branch.dineInPercentage}%

⭐ SATISFACCIÓN: ${branch.customerSatisfaction}%

🕐 HORAS PICO: ${branch.peakHours.join(', ')}

INSTRUCCIONES DE FORMATO Y ESTILO:
1. Responde SIEMPRE con datos específicos de la sucursal. Si no tienes un dato exacto, estima basándote en los datos disponibles y di "estimado según tendencia".
2. Sé directo y conciso. Máximo 3-4 párrafos cortos. El gerente está ocupado.
3. NUNCA uses asteriscos (**) ni markdown. Usa emojis para dar estructura visual: 📊 📈 📉 💡 ⚠️ ✅ 🎯 🔥 💰 👥 🍽️ ⭐
4. Formato: usa emojis al inicio de cada punto o sección, seguido de texto limpio.
5. Si preguntan algo fuera de los datos, responde con estimaciones lógicas basadas en el contexto. SIEMPRE responde, nunca digas "no tengo ese dato".
6. Responde en español colombiano natural. Nada de lenguaje técnico o corporativo rígido.
7. Si detectas una oportunidad o problema, menciónalo proactivamente.
8. Respuestas cortas y accionables. Nada de párrafos largos ni listas interminables.`;

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

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in crepes-chat-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
