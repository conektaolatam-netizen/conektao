import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    
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
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.restaurant_id) {
      throw new Error('User profile or restaurant not found');
    }

    const restaurantId = profile.restaurant_id;

    // Check and update AI usage limits
    const { data: aiLimits, error: limitsError } = await supabaseClient
      .from('ai_daily_limits')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (limitsError) {
      console.error('Error fetching AI limits:', limitsError);
    }

    // Create limits if they don't exist
    if (!aiLimits) {
      const { error: createError } = await supabaseClient
        .from('ai_daily_limits')
        .insert({
          restaurant_id: restaurantId,
          plan_type: 'basic',
          daily_limit: 10,
          current_usage: 0
        });

      if (createError) {
        console.error('Error creating AI limits:', createError);
      }
    }

    // Check if user has exceeded daily limit
    const currentLimits = aiLimits || { daily_limit: 10, current_usage: 0, additional_credits: 0 };
    const totalAllowed = currentLimits.daily_limit + currentLimits.additional_credits;
    
    if (currentLimits.current_usage >= totalAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Daily AI limit exceeded',
        limit_exceeded: true,
        current_usage: currentLimits.current_usage,
        total_allowed: totalAllowed
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get today's date range for local time
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const startOfDay = new Date(localToday);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(localToday);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's sales data with detailed information
    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales')
      .select(`
        id,
        total_amount,
        payment_method,
        table_number,
        created_at,
        sale_items (
          quantity,
          unit_price,
          subtotal,
          products (
            name,
            category,
            price
          )
        )
      `)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .eq('user_id', user.id);

    if (salesError) {
      console.error('Error fetching sales:', salesError);
    }

    // Fetch product performance
    const { data: productsData, error: productsError } = await supabaseClient
      .from('products')
      .select('id, name, price, cost_price, category')
      .eq('user_id', user.id);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Calculate analytics
    const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const totalOrders = salesData?.length || 0;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate hourly distribution
    const hourlyDistribution: { [key: number]: number } = {};
    salesData?.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + Number(sale.total_amount);
    });

    // Find peak hours
    const peakHours = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate product performance
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
    salesData?.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const productName = item.products?.name || 'Unknown';
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += Number(item.subtotal);
      });
    });

    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5);

    const analysisData = {
      date: localToday.toISOString().split('T')[0],
      totalSales,
      totalOrders,
      averageTicket,
      peakHours,
      topProducts,
      paymentMethods: salesData?.reduce((acc: any, sale) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
        return acc;
      }, {}),
      hourlyDistribution
    };

    // Create optimized prompt for daily analysis
    const prompt = `Analiza las ventas del día de hoy para el restaurante. Datos específicos:

📊 RESUMEN DEL DÍA:
- Ventas totales: $${totalSales.toLocaleString()} COP
- Órdenes totales: ${totalOrders}
- Ticket promedio: $${averageTicket.toFixed(0)} COP

🏆 PRODUCTOS TOP (por ingresos):
${topProducts.map(([name, data], i) => `${i+1}. ${name}: ${data.quantity} unidades, $${data.revenue.toFixed(0)} COP`).join('\n')}

⏰ HORARIOS PICO:
${peakHours.map(hour => `${hour}:00-${hour+1}:00 ($${(hourlyDistribution[hour] || 0).toFixed(0)} COP)`).join('\n')}

💳 MÉTODOS DE PAGO:
${Object.entries(analysisData.paymentMethods).map(([method, count]) => `${method}: ${count} transacciones`).join('\n')}

INSTRUCCIONES: Proporciona un análisis conciso y accionable en máximo 300 palabras que incluya:
1. Evaluación del rendimiento del día
2. Insights sobre productos y horarios
3. 2-3 recomendaciones específicas para mañana
4. Alertas si hay patrones preocupantes

Sé directo, útil y enfócate en acciones concretas.`;

    // Call OpenAI API with optimized settings
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto analista de restaurantes. Proporciona análisis concisos y recomendaciones accionables basadas en datos reales de ventas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      }),
    });

    const openaiData = await response.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Calculate token usage and cost (estimate)
    const tokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(aiResponse.length / 4);
    const costUSD = tokensUsed * 0.00000075; // GPT-4o-mini cost per token

    // Track AI usage
    await supabaseClient
      .from('ai_usage_tracking')
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        question_type: 'analysis',
        tokens_consumed: tokensUsed,
        cost_usd: costUSD,
        question_text: 'Daily sales analysis',
        response_text: aiResponse
      });

    // Update daily usage counter
    await supabaseClient
      .from('ai_daily_limits')
      .upsert({
        restaurant_id: restaurantId,
        current_usage: currentLimits.current_usage + 1,
        reset_date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'restaurant_id'
      });

    console.log('Daily analysis completed successfully');

    return new Response(JSON.stringify({
      analysis: aiResponse,
      data: analysisData,
      tokens_used: tokensUsed,
      cost_usd: costUSD,
      remaining_queries: totalAllowed - currentLimits.current_usage - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in daily analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate daily analysis'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});