import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { tenantId, queryType } = await req.json();

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    console.log(`[gas-ai-copilot] Processing request for tenant: ${tenantId}, type: ${queryType}`);

    const today = new Date().toISOString().split('T')[0];

    // Get routes
    const { data: routes } = await supabase
      .from('gas_routes')
      .select('*, vehicle:gas_vehicles(plate), plant:gas_plants(name)')
      .eq('tenant_id', tenantId)
      .gte('planned_date', today)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get deliveries for today
    const { data: deliveries } = await supabase
      .from('gas_deliveries')
      .select('*, client:gas_clients(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'delivered')
      .gte('delivered_at', `${today}T00:00:00`)
      .limit(50);

    // Get anomalies
    const { data: anomalies } = await supabase
      .from('gas_anomalies')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['new', 'in_review'])
      .limit(10);

    // Get payments for today
    const { data: payments } = await supabase
      .from('gas_payments_events')
      .select('*, delivery:gas_deliveries(total_amount)')
      .eq('tenant_id', tenantId)
      .gte('created_at', `${today}T00:00:00`)
      .limit(50);

    // Get inventory summary
    const { data: plantInventory } = await supabase
      .from('gas_inventory_ledger')
      .select('qty')
      .eq('tenant_id', tenantId)
      .not('plant_id', 'is', null);

    const totalPlantInventory = plantInventory?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    const totalDelivered = deliveries?.reduce((sum, d) => sum + (d.delivered_qty || 0), 0) || 0;
    const routesCount = routes?.length || 0;
    const inProgressRoutes = routes?.filter(r => r.status === 'in_progress').length || 0;
    const pendingReviewRoutes = routes?.filter(r => r.status === 'pending_return_review').length || 0;
    const anomalyCount = anomalies?.length || 0;
    const cashPayments = payments?.filter(p => p.method === 'cash').length || 0;
    const transferPayments = payments?.filter(p => p.method === 'transfer').length || 0;
    const creditPayments = payments?.filter(p => p.method === 'credit').length || 0;

    const context = `
Datos operativos del día para distribuidora de gas GLP:
- Inventario en planta: ${totalPlantInventory.toLocaleString()} kg
- Rutas del día: ${routesCount}
- Rutas en progreso: ${inProgressRoutes}
- Rutas pendientes de revisión: ${pendingReviewRoutes}
- Gas entregado hoy: ${totalDelivered.toLocaleString()} kg
- Entregas completadas: ${deliveries?.length || 0}
- Anomalías activas: ${anomalyCount}
- Pagos efectivo: ${cashPayments}, transferencias: ${transferPayments}, crédito: ${creditPayments}
${anomalies && anomalies.length > 0 ? `Anomalías: ${anomalies.map(a => `${a.title} (${a.severity})`).join(', ')}` : ''}
`;

    let prompt = '';
    switch (queryType) {
      case 'daily_summary':
        prompt = `Eres un asistente de gerencia para una distribuidora de gas GLP. Basándote en estos datos, da un resumen ejecutivo en máximo 3 líneas. Sé directo y menciona lo más importante primero:\n${context}`;
        break;
      case 'anomaly_alert':
        prompt = `Basándote en estos datos, identifica problemas críticos que requieran atención inmediata. Máximo 2 líneas:\n${context}`;
        break;
      case 'recommendations':
        prompt = `Basándote en estos datos operativos, da 1-2 recomendaciones concretas para mejorar la operación hoy. Sé específico:\n${context}`;
        break;
      default:
        prompt = `Eres un asistente de gerencia para una distribuidora de gas GLP. Basándote en estos datos, da un resumen ejecutivo breve:\n${context}`;
    }

    // Use Lovable AI Gateway (Gemini)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente ejecutivo para gerencia de distribuidoras de gas. Responde siempre en español, de forma concisa y accionable. Máximo 3 líneas.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gas-ai-copilot] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos agotados. Contacta al administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Error en servicio de IA');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No se pudo generar respuesta.';

    console.log(`[gas-ai-copilot] Generated response for ${queryType}`);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        context: {
          inventoryKg: totalPlantInventory,
          deliveredTodayKg: totalDelivered,
          routesCount,
          inProgressRoutes,
          pendingReviewRoutes,
          anomalyCount,
          payments: { cash: cashPayments, transfer: transferPayments, credit: creditPayments },
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gas-ai-copilot] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
