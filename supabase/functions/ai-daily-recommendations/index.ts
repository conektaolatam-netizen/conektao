import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Timezone helpers ──
function parseTimezoneOffset(tz: string): number {
  if (!tz) return -5;
  const match = tz.match(/^UTC([+-]?\d+)$/i);
  return match ? parseInt(match[1]) : -5;
}
function getRestaurantTime(offsetHours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + (offsetHours * 60 + now.getTimezoneOffset()) * 60000);
}
function getRestaurantDate(offsetHours: number): string {
  return getRestaurantTime(offsetHours).toISOString().split("T")[0];
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.restaurant_id) {
      throw new Error('Restaurant not found');
    }

    const restaurantId = profile.restaurant_id;

    // Fetch restaurant timezone
    const { data: tzConfig } = await supabaseClient
      .from('whatsapp_configs')
      .select('operating_hours')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();
    const tzOffset = parseTimezoneOffset(tzConfig?.operating_hours?.timezone);

    // Date ranges using restaurant timezone
    const localNow = getRestaurantTime(tzOffset);
    const yesterdayLocal = new Date(localNow.getTime() - 86400000);
    const lastWeekLocal = new Date(localNow.getTime() - 7 * 86400000);

    const todayStr = getRestaurantDate(tzOffset);
    const yesterdayStr = yesterdayLocal.toISOString().split('T')[0];
    const lastWeekStr = lastWeekLocal.toISOString().split('T')[0];

    // Get all products with their costs and recipes
    const { data: productsWithCosts } = await supabaseClient
      .from('products')
      .select(`
        id,
        name,
        price,
        cost_price,
        category_id,
        categories(name),
        product_ingredients(
          quantity_needed,
          ingredients(
            name,
            cost_per_unit,
            unit,
            current_stock
          )
        )
      `)
      .eq('is_active', true);

    // Calculate real costs for each product
    const productCostMap = new Map();
    productsWithCosts?.forEach(product => {
      let calculatedCost = product.cost_price || 0;
      
      if (product.product_ingredients?.length > 0) {
        calculatedCost = product.product_ingredients.reduce((sum, pi) => {
          const ingredientCost = (pi.ingredients?.cost_per_unit || 0) * pi.quantity_needed;
          return sum + ingredientCost;
        }, 0);
      }
      
      const margin = product.price - calculatedCost;
      const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0;
      
      productCostMap.set(product.id, {
        name: product.name,
        price: product.price,
        cost: calculatedCost,
        margin: margin,
        marginPercent: marginPercent,
        category: product.categories?.name || 'Sin categoría',
        hasLowStock: product.product_ingredients?.some(pi => 
          (pi.ingredients?.current_stock || 0) < pi.quantity_needed * 10
        ) || false
      });
    });

    // Fetch detailed sales data with product info
    const { data: todaySales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        subtotal,
        product_id,
        products!inner(name, price, category_id),
        sales!inner(created_at, payment_method, user_id, table_number)
      `)
      .gte('sales.created_at', todayStr)
      .lt('sales.created_at', new Date(new Date(todayStr).getTime() + 86400000).toISOString().split('T')[0]);

    const { data: yesterdaySales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        subtotal,
        product_id,
        products!inner(name),
        sales!inner(created_at, user_id)
      `)
      .gte('sales.created_at', yesterdayStr)
      .lt('sales.created_at', todayStr);

    const { data: lastWeekSales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        subtotal,
        product_id,
        products!inner(name)
      `)
      .gte('sales.created_at', lastWeekStr)
      .lt('sales.created_at', yesterdayStr);

    // Analyze product performance with costs
    const productPerformance = new Map();
    
    todaySales?.forEach(item => {
      const productId = item.product_id;
      const productInfo = productCostMap.get(productId);
      
      if (!productPerformance.has(productId)) {
        productPerformance.set(productId, {
          name: item.products.name,
          today_qty: 0,
          today_revenue: 0,
          yesterday_qty: 0,
          lastweek_qty: 0,
          ...productInfo
        });
      }
      
      const perf = productPerformance.get(productId);
      perf.today_qty += item.quantity;
      perf.today_revenue += parseFloat(item.subtotal);
    });

    yesterdaySales?.forEach(item => {
      const productId = item.product_id;
      if (productPerformance.has(productId)) {
        productPerformance.get(productId).yesterday_qty += item.quantity;
      } else if (productCostMap.has(productId)) {
        const productInfo = productCostMap.get(productId);
        productPerformance.set(productId, {
          name: item.products.name,
          today_qty: 0,
          today_revenue: 0,
          yesterday_qty: item.quantity,
          lastweek_qty: 0,
          ...productInfo
        });
      }
    });

    lastWeekSales?.forEach(item => {
      const productId = item.product_id;
      if (productPerformance.has(productId)) {
        productPerformance.get(productId).lastweek_qty += item.quantity;
      }
    });

    // Calculate metrics and find opportunities
    const opportunities = [];
    
    for (const [productId, data] of productPerformance.entries()) {
      const dailyChange = data.yesterday_qty > 0 
        ? ((data.today_qty - data.yesterday_qty) / data.yesterday_qty) * 100 
        : 0;
      
      const weeklyChange = data.lastweek_qty > 0
        ? ((data.today_qty - data.lastweek_qty) / data.lastweek_qty) * 100
        : 0;

      data.dailyChange = dailyChange;
      data.weeklyChange = weeklyChange;
      data.totalMargin = data.margin * data.today_qty;

      // Identify opportunities
      if (dailyChange < -20 && data.marginPercent > 50) {
        opportunities.push({
          type: 'at_risk_high_margin',
          severity: 'high',
          product: data,
          reason: 'Producto con alta rentabilidad pero ventas en caída'
        });
      } else if (dailyChange > 30 && data.today_qty > 5) {
        opportunities.push({
          type: 'trending_up',
          severity: 'medium',
          product: data,
          reason: 'Producto en tendencia ascendente'
        });
      } else if (data.today_qty > 0 && data.marginPercent < 30) {
        opportunities.push({
          type: 'low_margin',
          severity: 'medium',
          product: data,
          reason: 'Margen bajo, considera ajustar precio'
        });
      } else if (data.hasLowStock && data.today_qty > 3) {
        opportunities.push({
          type: 'low_stock_high_demand',
          severity: 'high',
          product: data,
          reason: 'Alta demanda con inventario bajo'
        });
      }
    }

    // Sort by severity and select top opportunity
    opportunities.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const topOpportunity = opportunities[0] || null;

    // Calculate overall metrics
    const todayTotal = todaySales?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;
    const yesterdayTotal = yesterdaySales?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;
    const dailyChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;

    // Validate minimum data for recommendations
    const hasMinimumData = todaySales && todaySales.length >= 5 && yesterdaySales && yesterdaySales.length >= 3;
    
    if (!hasMinimumData) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_DATA',
        message: 'Aún no hay suficientes datos para sugerencias inteligentes. Sigue usando Conektao y pronto te daremos estrategias basadas en tu operación real.',
        data_context: {
          todayTotal,
          yesterdayTotal,
          dailyChange,
          salesCount: todaySales?.length || 0
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create AI prompt with ULTRA-STRICT format requirements
    const systemPrompt = `Eres un analista de negocio experto. Análisis objetivo basado ÚNICAMENTE en datos reales. Cero entusiasmo, cero felicitaciones vacías, cero lenguaje genérico.

PROHIBIDO USAR:
❌ "¡Listos para impulsar!"
❌ "¡Aquí el punto FLAAAZO!"
❌ "¡Excelente!"
❌ "Está yendo bien"
❌ "Sigue así"
❌ Asteriscos (*) en cualquier parte del texto
❌ Optimismo sin fundamento
❌ Frases motivacionales

OBLIGATORIO:
✓ Análisis objetivo con datos concretos
✓ Comparativas numéricas exactas
✓ Diagnóstico directo del problema o oportunidad
✓ Estrategia accionable con números calculados
✓ Pasos específicos para implementar

FORMATO EXACTO (respetar estructura):

🔍 Análisis del Producto: [Nombre del Producto]
📉 Rendimiento: [cambio]% vs [periodo comparado]
💲 Costo: $[número] | 🏷️ Precio actual: $[número]

🎯 Estrategia IA Recomendada
→ [Acción concreta con precio/descuento específico]
→ Margen resultante: $[número]/unidad

📣 Acción sugerida
[Pasos específicos numerados o con guiones]
- [paso 1]
- [paso 2]
- [paso 3]
- [paso 4]

Si no hay oportunidad clara, responde: "Sin acción recomendada por ahora. Continúa monitoreando."

NO inventes datos. NO uses lenguaje emocional. NO trunces el texto. Sé profesional y directo.`;

    let userPrompt = '';

    if (topOpportunity) {
      const p = topOpportunity.product;
      
      // Calculate suggested price for discount strategies
      const suggestedDiscount = p.marginPercent > 50 ? 0.25 : 0.15;
      const suggestedPrice = p.price * (1 - suggestedDiscount);
      const newMargin = suggestedPrice - p.cost;
      
      userPrompt = `DATOS REALES DEL PRODUCTO:

Producto: ${p.name}
Categoría: ${p.category}
Precio actual: $${p.price?.toLocaleString()} COP
Costo real: $${p.cost?.toFixed(0).toLocaleString()} COP
Margen actual: $${p.margin?.toFixed(0).toLocaleString()} COP (${p.marginPercent?.toFixed(1)}%)

RENDIMIENTO:
- Hoy: ${p.today_qty} unidades vendidas
- Ayer: ${p.yesterday_qty} unidades
- Cambio: ${p.dailyChange >= 0 ? '+' : ''}${p.dailyChange?.toFixed(1)}%

TIPO DE OPORTUNIDAD: ${topOpportunity.type}

Genera un análisis profesional siguiendo el FORMATO EXACTO especificado.

Usa este formato:
🔍 Análisis del Producto: ${p.name}
📉 Rendimiento: ${p.dailyChange >= 0 ? '+' : ''}${p.dailyChange?.toFixed(1)}% vs ayer
💲 Costo: $${p.cost?.toFixed(0).toLocaleString()} | 🏷️ Precio actual: $${p.price?.toLocaleString()}

🎯 Estrategia IA Recomendada
→ [Tu recomendación específica con precio calculado]
→ Margen resultante: $[calcular y mostrar]

📣 Acción sugerida
[Pasos específicos]
- [paso 1]
- [paso 2]
- [paso 3]

NO uses lenguaje emocional. NO felicites. SÉ OBJETIVO.`;
    } else {
      userPrompt = `DATOS GENERALES DEL DÍA:

Ventas totales hoy: $${todayTotal.toLocaleString()} COP
Ventas ayer: $${yesterdayTotal.toLocaleString()} COP
Cambio: ${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}%

TOP 3 PRODUCTOS:
${Array.from(productPerformance.values())
  .sort((a, b) => b.today_qty - a.today_qty)
  .slice(0, 3)
  .map((p, i) => `${i+1}. ${p.name}: ${p.today_qty} uds, Margen: ${p.marginPercent?.toFixed(1)}%`)
  .join('\n')}

Genera un análisis profesional del día siguiendo el FORMATO EXACTO.

Usa esta estructura:
🔍 Análisis General del Día
📊 Ventas: $${todayTotal.toLocaleString()} (${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}% vs ayer)
🎯 Ticket promedio: [calcular si es posible]

🎯 Estrategia IA Recomendada
→ [Tu recomendación específica para mejorar ventas]

📣 Acción sugerida
[Pasos específicos]
- [paso 1]
- [paso 2]
- [paso 3]

NO uses lenguaje emocional. SÉ OBJETIVO y PROFESIONAL.`;
    }

    // Call AI
    const aiResponse = await retryWithBackoff(async () => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 600,
          temperature: 0.3
        }),
      });

      if (response.status === 429) {
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
      }

      if (response.status === 402) {
        const error: any = new Error('Payment required');
        error.status = 402;
        throw error;
      }

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return response;
    });

    const aiData = await aiResponse.json();
    let recommendation = aiData.choices[0].message.content;
    
    // Clean up any remaining asterisks
    recommendation = recommendation.replace(/\*\*/g, '').replace(/\*/g, '');

    // Determine priority
    let priority = 'medium';
    if (topOpportunity) {
      priority = topOpportunity.severity === 'high' ? 'high' : 'medium';
    } else if (dailyChange < -15) {
      priority = 'high';
    }

    // Save to database
    const contextData = {
      todayTotal,
      yesterdayTotal,
      dailyChange,
      opportunity: topOpportunity ? {
        type: topOpportunity.type,
        product: {
          name: topOpportunity.product.name,
          price: topOpportunity.product.price,
          cost: topOpportunity.product.cost,
          margin: topOpportunity.product.margin,
          marginPercent: topOpportunity.product.marginPercent,
          today_qty: topOpportunity.product.today_qty,
          today_revenue: topOpportunity.product.today_revenue,
          dailyChange: topOpportunity.product.dailyChange
        }
      } : null,
      topProducts: Array.from(productPerformance.values())
        .sort((a, b) => b.today_qty - a.today_qty)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          quantity: p.today_qty,
          revenue: p.today_revenue,
          margin: p.margin,
          marginPercent: p.marginPercent
        }))
    };

    const { data: savedRecommendation, error: saveError } = await supabaseClient
      .from('ai_daily_recommendations')
      .insert({
        restaurant_id: restaurantId,
        recommendation_text: recommendation,
        recommendation_type: topOpportunity?.type || 'general_optimization',
        priority,
        date: todayStr,
        data_context: contextData
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    return new Response(JSON.stringify({
      recommendation,
      priority,
      data_context: contextData,
      recommendation_id: savedRecommendation?.id,
      saved: !saveError,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-daily-recommendations:', error);
    
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'Sistema ocupado generando recomendaciones. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        error: 'Servicio de recomendaciones IA temporalmente no disponible. Contacta soporte.',
        code: 'PAYMENT_REQUIRED'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
