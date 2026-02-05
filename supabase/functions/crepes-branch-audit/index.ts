import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffAlert {
  type: "lateness" | "absence" | "performance";
  severity: "warning" | "critical" | "info";
  employee: string;
  message: string;
  metric: string;
}

interface ErrorPattern {
  product: string;
  errorType: string;
  count: number;
  trend: "increasing" | "decreasing" | "stable";
  recommendation: string;
}

interface ProductRotation {
  product: string;
  category: string;
  currentSales: number;
  expectedSales: number;
  variance: number;
  trend: "up" | "down" | "stable";
}

interface AuditResult {
  overallScore: number;
  scoreBreakdown: {
    staff: number;
    operations: number;
    quality: number;
    efficiency: number;
  };
  staffAlerts: StaffAlert[];
  errorPatterns: ErrorPattern[];
  productRotation: {
    underperforming: ProductRotation[];
    recommendation: string;
  };
  dailySummary: string;
}

// Simulated branch data for demo
function getSimulatedBranchData(branchId: string): AuditResult {
  const staffAlerts: StaffAlert[] = [
    {
      type: "lateness",
      severity: "warning",
      employee: "Equipo general",
      message: "El personal está llegando 12 minutos tarde en promedio esta semana",
      metric: "+12 min vs horario",
    },
    {
      type: "absence",
      severity: "info",
      employee: "María González",
      message: "3 ausencias registradas este mes",
      metric: "3 ausencias / mes",
    },
    {
      type: "performance",
      severity: "warning", 
      employee: "Turno mañana",
      message: "Tiempo de preparación 15% más lento que el turno de la tarde",
      metric: "+15% tiempo prep",
    },
  ];

  const errorPatterns: ErrorPattern[] = [
    {
      product: "Crepe Stroganoff",
      errorType: "Errores en preparación",
      count: 5,
      trend: "increasing",
      recommendation: "Revisar receta y capacitar al equipo de cocina",
    },
    {
      product: "Waffle Nutella",
      errorType: "Devoluciones por presentación",
      count: 2,
      trend: "stable",
      recommendation: "Verificar estándares de emplatado",
    },
    {
      product: "Helado Triple",
      errorType: "Pedidos incorrectos",
      count: 3,
      trend: "decreasing",
      recommendation: "Mejorar comunicación cocina-meseros",
    },
  ];

  const underperformingProducts: ProductRotation[] = [
    {
      product: "Crepe de Pollo",
      category: "Platos Salados",
      currentSales: 12,
      expectedSales: 18,
      variance: -33,
      trend: "down",
    },
    {
      product: "Helado de Pistacho",
      category: "Postres",
      currentSales: 8,
      expectedSales: 15,
      variance: -47,
      trend: "down",
    },
    {
      product: "Waffle de Pollo y Champiñones",
      category: "Platos Salados",
      currentSales: 5,
      expectedSales: 10,
      variance: -50,
      trend: "down",
    },
    {
      product: "Limonada de Coco",
      category: "Bebidas",
      currentSales: 14,
      expectedSales: 22,
      variance: -36,
      trend: "stable",
    },
  ];

  // Calculate overall score
  const staffScore = 75; // Based on lateness and absences
  const operationsScore = 82; // Based on order times
  const qualityScore = 78; // Based on error patterns
  const efficiencyScore = 88; // Based on table turnover

  const overallScore = Math.round((staffScore + operationsScore + qualityScore + efficiencyScore) / 4);

  return {
    overallScore,
    scoreBreakdown: {
      staff: staffScore,
      operations: operationsScore,
      quality: qualityScore,
      efficiency: efficiencyScore,
    },
    staffAlerts,
    errorPatterns,
    productRotation: {
      underperforming: underperformingProducts,
      recommendation: "🎯 Hoy impulsa con las meseras: Crepe de Pollo (-33%), Helado de Pistacho (-47%) y Waffle de Pollo (-50%). La rotación baja de estos productos afecta el margen general.",
    },
    dailySummary: "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { branch_id = "zona-t" } = await req.json();

    console.log(`Generating audit for branch: ${branch_id}`);

    // Get simulated data (in production, this would query real database)
    const auditData = getSimulatedBranchData(branch_id);

    // Generate AI summary using Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY) {
      try {
        const summaryPrompt = `Eres el auditor de IA de Crepes & Waffles para la sucursal ${branch_id}. 
Genera un resumen ejecutivo de 3-4 oraciones basado en estos datos:

ESTADO GENERAL: ${auditData.overallScore}%
- Personal: ${auditData.scoreBreakdown.staff}%
- Operaciones: ${auditData.scoreBreakdown.operations}%
- Calidad: ${auditData.scoreBreakdown.quality}%
- Eficiencia: ${auditData.scoreBreakdown.efficiency}%

ALERTAS DE PERSONAL:
${auditData.staffAlerts.map(a => `- ${a.message}`).join('\n')}

PATRONES DE ERROR:
${auditData.errorPatterns.map(e => `- ${e.product}: ${e.count} ${e.errorType}`).join('\n')}

PRODUCTOS CON BAJA ROTACIÓN:
${auditData.productRotation.underperforming.map(p => `- ${p.product}: ${p.variance}%`).join('\n')}

El resumen debe ser directo, identificar las 2 prioridades principales del día, y dar acciones concretas.
NO menciones inventario ni stock - eso lo maneja otro sistema.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Eres un auditor de operaciones de restaurante. Responde de forma directa y práctica, como un consultor senior." },
              { role: "user", content: summaryPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          auditData.dailySummary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (aiError) {
        console.error("Error generating AI summary:", aiError);
      }
    }

    if (!auditData.dailySummary) {
      auditData.dailySummary = `📊 Estado de la sucursal: ${auditData.overallScore}%. Prioridades del día: 1) Corregir puntualidad del personal (12 min tarde promedio). 2) Impulsar productos con baja rotación - especialmente Crepe de Pollo y Helado de Pistacho.`;
    }

    return new Response(JSON.stringify({
      ...auditData,
      generatedAt: new Date().toISOString(),
      branch_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in crepes-branch-audit:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
