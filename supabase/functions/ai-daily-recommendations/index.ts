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

// Helper function for retry with exponential backoff
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
      
      // Don't retry on 402 (payment required) or non-rate-limit errors
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
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
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user data
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile and restaurant
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.restaurant_id) {
      throw new Error('Restaurant not found');
    }

    const restaurantId = profile.restaurant_id;

    // Get sales data from today, yesterday, and last week
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    // Fetch sales data for today
    const { data: todaySales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        subtotal,
        sales!inner(created_at, payment_method, user_id),
        products!inner(name, price)
      `)
      .gte('sales.created_at', todayStr)
      .lt('sales.created_at', new Date(Date.now() + 86400000).toISOString());

    // Fetch sales data for yesterday
    const { data: yesterdaySales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        subtotal,
        sales!inner(created_at, user_id),
        products!inner(name)
      `)
      .gte('sales.created_at', yesterdayStr)
      .lt('sales.created_at', todayStr);

    // Fetch sales data for last week
    const { data: lastWeekSales } = await supabaseClient
      .from('sale_items')
      .select(`
        quantity,
        products!inner(name)
      `)
      .gte('sales.created_at', lastWeekStr)
      .lt('sales.created_at', new Date(lastWeekStr).setDate(new Date(lastWeekStr).getDate() + 1));

    // Calculate metrics
    const todayTotal = todaySales?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;
    const yesterdayTotal = yesterdaySales?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;
    
    const dailyChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;

    // Product performance comparison
    const productComparison = new Map();
    
    todaySales?.forEach(item => {
      const name = item.products.name;
      if (!productComparison.has(name)) {
        productComparison.set(name, { today: 0, yesterday: 0, lastWeek: 0 });
      }
      productComparison.get(name).today += item.quantity;
    });

    yesterdaySales?.forEach(item => {
      const name = item.products.name;
      if (!productComparison.has(name)) {
        productComparison.set(name, { today: 0, yesterday: 0, lastWeek: 0 });
      }
      productComparison.get(name).yesterday += item.quantity;
    });

    lastWeekSales?.forEach(item => {
      const name = item.products.name;
      if (!productComparison.has(name)) {
        productComparison.set(name, { today: 0, yesterday: 0, lastWeek: 0 });
      }
      productComparison.get(name).lastWeek += item.quantity;
    });

    // Calculate changes and find significant movements
    const productChanges = Array.from(productComparison.entries()).map(([name, data]) => {
      const change = data.yesterday > 0 ? ((data.today - data.yesterday) / data.yesterday * 100) : 0;
      const weeklyChange = data.lastWeek > 0 ? ((data.today - data.lastWeek) / data.lastWeek * 100) : 0;
      return { name, ...data, change, weeklyChange };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const significantChanges = productChanges.filter(p => Math.abs(p.change) > 15).slice(0, 5);

    const weeklyChange = lastWeekSales && lastWeekSales.length > 0 
      ? ((todayTotal - (lastWeekSales.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0))) 
         / (lastWeekSales.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0)) * 100)
      : 0;

    // Create prompt for AI
    const systemPrompt = 'Eres un consultor de restaurantes experto en optimización de ventas. Genera recomendaciones específicas y accionables basadas en datos reales de comparación de ventas.';
    
    const prompt = `Análisis de ventas para generar recomendaciones:

📊 VENTAS:
- Hoy: $${todayTotal.toLocaleString()} COP
- Ayer: $${yesterdayTotal.toLocaleString()} COP
- Cambio diario: ${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}%
- Cambio semanal: ${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(1)}%

🔄 PRODUCTOS CON CAMBIOS SIGNIFICATIVOS (>15%):
${significantChanges.map(p => 
  `${p.name}: ${p.change >= 0 ? '+' : ''}${p.change.toFixed(1)}% (${p.today} vs ${p.yesterday} unidades)`
).join('\n')}

INSTRUCCIONES: Genera 1-2 recomendaciones específicas y accionables de máximo 200 palabras que incluyan:
1. Una acción concreta basada en los datos (promoción, ajuste de precio, estrategia de marketing)
2. Horario o período específico para implementarla
3. Métrica esperada o objetivo a lograr
4. Si hay productos con caída >20%, sugiere estrategias específicas

Formato: [ACCIÓN] - [CUANDO] - [OBJETIVO]
Sé directo y práctico.`;

    // Call Lovable AI Gateway with retry
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
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 300
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

    const openaiData = await aiResponse.json();
    const recommendation = openaiData.choices[0].message.content;

    // Determine priority based on performance
    let priority = 'medium';
    if (dailyChange < -15 || weeklyChange < -20) priority = 'high';
    if (dailyChange > 15 || weeklyChange > 20) priority = 'low';

    // Save recommendation to database
    const { data: savedRecommendation, error: saveError } = await supabaseClient
      .from('ai_daily_recommendations')
      .insert({
        restaurant_id: restaurantId,
        recommendation_text: recommendation,
        recommendation_type: 'sales_optimization',
        priority,
        date: todayStr,
        data_context: {
          todayTotal,
          yesterdayTotal,
          dailyChange,
          weeklyChange,
          topChanges: significantChanges
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    return new Response(JSON.stringify({
      recommendation,
      priority,
      salesContext: {
        todayTotal,
        yesterdayTotal,
        dailyChange: dailyChange.toFixed(1),
        weeklyChange: weeklyChange.toFixed(1)
      },
      topChanges: significantChanges,
      saved: !saveError,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-daily-recommendations:', error);
    
    // Handle specific error types
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
        error: 'Servicio de recomendaciones IA temporalmente no disponible. Por favor contacta soporte.',
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
