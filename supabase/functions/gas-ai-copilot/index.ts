import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenantId, queryType } = await req.json();

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    console.log(`[gas-ai-copilot] Processing request for tenant: ${tenantId}, type: ${queryType}`);

    // Fetch today's data for the tenant
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

    // Build context for AI
    const context = `
Datos del día para distribuidora de gas:
- Inventario en planta: ${totalPlantInventory.toLocaleString()} kg
- Rutas del día: ${routesCount}
- Rutas en progreso: ${inProgressRoutes}
- Rutas pendientes de revisión: ${pendingReviewRoutes}
- Gas entregado hoy: ${totalDelivered.toLocaleString()} kg
- Entregas completadas: ${deliveries?.length || 0}
- Anomalías activas: ${anomalyCount}
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

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente ejecutivo para gerencia de distribuidoras de gas. Responde siempre en español, de forma concisa y accionable. Máximo 3 líneas.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gas-ai-copilot] OpenAI error:', errorText);
      throw new Error('Error calling AI service');
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
