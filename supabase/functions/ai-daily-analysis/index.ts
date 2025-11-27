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

    const currentLimits = aiLimits || {
      daily_limit: 30,
      current_usage: 0,
      additional_credits: 0
    };

    const totalAvailable = currentLimits.daily_limit + (currentLimits.additional_credits || 0);
    
    if (currentLimits.current_usage >= totalAvailable) {
      return new Response(JSON.stringify({ 
        error: 'Daily AI analysis limit reached',
        limit: totalAvailable,
        used: currentLimits.current_usage 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get today's sales data
    const today = new Date().toISOString().split('T')[0];
    
    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (
            name,
            price
          )
        )
      `)
      .gte('created_at', today)
      .lt('created_at', new Date(Date.now() + 86400000).toISOString())
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales:', salesError);
    }

    // Calculate key metrics
    const totalSales = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
    const totalOrders = salesData?.length || 0;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Analyze hourly distribution
    const hourlyDistribution: Record<number, number> = {};
    salesData?.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + sale.total_amount;
    });

    const peakHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Top products by revenue
    const productRevenue: Record<string, { quantity: number; revenue: number }> = {};
    salesData?.forEach(sale => {
      sale.sale_items?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown';
        if (!productRevenue[productName]) {
          productRevenue[productName] = { quantity: 0, revenue: 0 };
        }
        productRevenue[productName].quantity += item.quantity;
        productRevenue[productName].revenue += item.subtotal;
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5);

    const analysisData = {
      totalSales,
      totalOrders,
      averageTicket,
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
              content: 'Eres un experto analista de restaurantes. Proporciona análisis concisos y recomendaciones accionables basadas en datos reales de ventas.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 400
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
    const aiResponseText = openaiData.choices[0].message.content;

    // Calculate token usage and cost (estimate)
    const tokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(aiResponseText.length / 4);
    const costUSD = tokensUsed * 0.00000035; // Gemini 2.5 Flash cost per token

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
        response_text: aiResponseText
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

    return new Response(JSON.stringify({
      analysis: aiResponseText,
      data: analysisData,
      tokensUsed,
      costUSD,
      remainingQueries: totalAvailable - currentLimits.current_usage - 1,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-daily-analysis:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'Sistema ocupado generando análisis. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        error: 'Servicio de análisis IA temporalmente no disponible. Por favor contacta soporte.',
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
