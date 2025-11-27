import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Date ranges
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

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
      .lt('sales.created_at', new Date(Date.now() + 86400000).toISOString());

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

    // Create AI prompt with real data
    let systemPrompt = `Eres un consultor experto en restaurantes especializado en estrategias de marketing y optimización de ventas. 

Generas recomendaciones:
- CONCRETAS: con producto específico, acción clara
- ACCIONABLES: que se puedan implementar en minutos
- RENTABLES: basadas en márgenes reales
- CREATIVAS: usando marketing digital, combos, descuentos estratégicos

Formato obligatorio:
**[EMOJI] [TIPO]: [Nombre del Producto]**

**📊 Datos del Producto:**
- [Datos clave del producto]

**🧠 Análisis:**
[Interpretación breve del rendimiento]

**💡 Estrategia Concreta:**
[Acción específica paso a paso]

**🎯 Resultado Esperado:**
[Métrica o impacto esperado]`;

    let userPrompt = '';

    if (topOpportunity) {
      const p = topOpportunity.product;
      userPrompt = `Genera UNA recomendación específica basada en este hallazgo:

TIPO DE OPORTUNIDAD: ${topOpportunity.type}
RAZÓN: ${topOpportunity.reason}

PRODUCTO: ${p.name}
CATEGORÍA: ${p.category}
PRECIO ACTUAL: $${p.price?.toLocaleString()} COP
COSTO REAL: $${p.cost?.toFixed(0).toLocaleString()} COP
MARGEN: $${p.margin?.toFixed(0).toLocaleString()} COP (${p.marginPercent?.toFixed(1)}%)

RENDIMIENTO:
- Ventas hoy: ${p.today_qty} unidades → $${p.today_revenue?.toLocaleString()} COP
- Ventas ayer: ${p.yesterday_qty} unidades
- Cambio diario: ${p.dailyChange >= 0 ? '+' : ''}${p.dailyChange?.toFixed(1)}%
- Tendencia semanal: ${p.weeklyChange >= 0 ? '+' : ''}${p.weeklyChange?.toFixed(1)}%

CONTEXTO GENERAL:
- Ventas totales hoy: $${todayTotal.toLocaleString()} COP
- Cambio vs ayer: ${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}%

Genera una estrategia concreta que incluya:
1. Acción específica (descuento %, combo, promoción en redes)
2. Timing exacto (cuando implementar)
3. Público objetivo específico
4. Resultado esperado con números`;
    } else {
      userPrompt = `Genera UNA recomendación general basada en las ventas de hoy:

RESUMEN DEL DÍA:
- Ventas totales: $${todayTotal.toLocaleString()} COP
- Ventas ayer: $${yesterdayTotal.toLocaleString()} COP
- Cambio: ${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}%

TOP 3 PRODUCTOS MÁS VENDIDOS HOY:
${Array.from(productPerformance.values())
  .sort((a, b) => b.today_qty - a.today_qty)
  .slice(0, 3)
  .map((p, i) => `${i+1}. ${p.name}: ${p.today_qty} unidades, Margen: ${p.marginPercent?.toFixed(1)}%`)
  .join('\n')}

Genera una estrategia de crecimiento enfocada en aumentar ventas manteniendo rentabilidad.`;
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
          max_completion_tokens: 500
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
    const recommendation = aiData.choices[0].message.content;

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
