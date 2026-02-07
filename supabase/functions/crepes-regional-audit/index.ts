import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const regionalAudit = {
      regionalScore: 81,
      totalBranches: 5,
      healthyBranches: 3,
      warningBranches: 1,
      criticalBranches: 1,
      summary: "Tu región opera al 81%. 3 sucursales están saludables, 1 necesita atención y 1 requiere intervención urgente.",
      branches: [
        {
          id: "andino",
          name: "Crepes Andino",
          score: 92,
          status: "healthy",
          salestoday: 5800000,
          salesYesterday: 18500000,
          staffPresent: "12/12",
          topIssue: null,
          aiSummary: "Mejor desempeño regional. Upselling efectivo, equipo completo.",
          lat: 4.6669,
          lng: -74.0530,
        },
        {
          id: "zona-t",
          name: "Crepes Zona T",
          score: 87,
          status: "healthy",
          salestoday: 4300000,
          salesYesterday: 16200000,
          staffPresent: "8/10",
          topIssue: null,
          aiSummary: "Operación estable. Lluvia prevista mañana, reforzar domicilios.",
          lat: 4.6697,
          lng: -74.0524,
        },
        {
          id: "santa-fe",
          name: "Crepes Santafé",
          score: 84,
          status: "healthy",
          salestoday: 4100000,
          salesYesterday: 15300000,
          staffPresent: "9/10",
          topIssue: "1 reclamo de domicilio",
          aiSummary: "Estable. Monitorear tiempos de entrega a domicilio.",
          lat: 4.6517,
          lng: -74.0577,
        },
        {
          id: "unicentro",
          name: "Crepes Unicentro",
          score: 78,
          status: "warning",
          salestoday: 3100000,
          salesYesterday: 12800000,
          staffPresent: "7/9",
          topIssue: "Tiempo de servicio elevado (14 min)",
          aiSummary: "Tiempo de servicio alto. Revisar rotación de turnos en horas pico.",
          lat: 4.7032,
          lng: -74.0428,
        },
        {
          id: "san-martin",
          name: "Crepes San Martín",
          score: 62,
          status: "critical",
          salestoday: 2800000,
          salesYesterday: 11200000,
          staffPresent: "6/9",
          topIssue: "Múltiples alertas operativas",
          aiSummary: "URGENTE: 3 ausencias injustificadas, 8 errores de preparación esta semana, diferencia de caja $185,000, inventario bajo mínimo en 4 ítems.",
          details: {
            issues: [
              { type: "staff", severity: "critical", message: "3 empleados ausentes sin justificación", metric: "33% ausentismo" },
              { type: "inventory", severity: "critical", message: "4 ítems de frutas frescas bajo mínimo", metric: "Stock crítico" },
              { type: "errors", severity: "warning", message: "8 errores de preparación esta semana", metric: "+60% vs promedio" },
              { type: "cash", severity: "warning", message: "Diferencia de caja de $185,000 el martes", metric: "$185,000 COP" },
            ],
            recommendations: [
              "Programar visita presencial inmediata para evaluar ausentismo",
              "Revisar proveedores de frutas frescas y acelerar reposición",
              "Reunión con equipo de cocina sobre estándares de preparación",
              "Auditar cierre de caja del martes con empleado responsable",
            ],
          },
          lat: 4.6748,
          lng: -74.0626,
        },
      ],
    };

    return new Response(JSON.stringify(regionalAudit), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in crepes-regional-audit:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
