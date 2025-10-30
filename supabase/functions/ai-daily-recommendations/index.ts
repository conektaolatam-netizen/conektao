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

    // Get date ranges for comparison
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Helper function to get day range
    const getDayRange = (date: Date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    };

    const todayRange = getDayRange(today);
    const yesterdayRange = getDayRange(yesterday);
    const lastWeekRange = getDayRange(lastWeek);

    // Fetch today's sales
    const { data: todaySales } = await supabaseClient
      .from('sales')
      .select(`
        total_amount,
        sale_items (
          quantity,
          products (name, category)
        )
      `)
      .gte('created_at', todayRange.start)
      .lte('created_at', todayRange.end)
      .eq('user_id', user.id);

    // Fetch yesterday's sales
    const { data: yesterdaySales } = await supabaseClient
      .from('sales')
      .select(`
        total_amount,
        sale_items (
          quantity,
          products (name, category)
        )
      `)
      .gte('created_at', yesterdayRange.start)
      .lte('created_at', yesterdayRange.end)
      .eq('user_id', user.id);

    // Fetch last week same day sales
    const { data: lastWeekSales } = await supabaseClient
      .from('sales')
      .select(`
        total_amount,
        sale_items (
          quantity,
          products (name, category)
        )
      `)
      .gte('created_at', lastWeekRange.start)
      .lte('created_at', lastWeekRange.end)
      .eq('user_id', user.id);

    // Calculate metrics
    const todayTotal = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const yesterdayTotal = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const lastWeekTotal = lastWeekSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    // Calculate product performance comparison
    const getProductSales = (sales: any[]) => {
      const productSales: { [key: string]: number } = {};
      sales?.forEach(sale => {
        sale.sale_items?.forEach((item: any) => {
          const productName = item.products?.name || 'Unknown';
          productSales[productName] = (productSales[productName] || 0) + item.quantity;
        });
      });
      return productSales;
    };

    const todayProducts = getProductSales(todaySales || []);
    const yesterdayProducts = getProductSales(yesterdaySales || []);
    const lastWeekProducts = getProductSales(lastWeekSales || []);

    // Calculate percentage changes
    const dailyChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const weeklyChange = lastWeekTotal > 0 ? ((todayTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    // Find products with significant changes
    const productChanges: { name: string; change: number; today: number; yesterday: number }[] = [];
    
    Object.keys({ ...todayProducts, ...yesterdayProducts }).forEach(product => {
      const today = todayProducts[product] || 0;
      const yesterday = yesterdayProducts[product] || 0;
      
      if (yesterday > 0) {
        const change = ((today - yesterday) / yesterday) * 100;
        if (Math.abs(change) > 20) { // Only significant changes
          productChanges.push({ name: product, change, today, yesterday });
        }
      }
    });

    // Sort by most significant changes
    productChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Create data context
    const analysisContext = {
      todayTotal,
      yesterdayTotal,
      lastWeekTotal,
      dailyChange,
      weeklyChange,
      topProductChanges: productChanges.slice(0, 5),
      totalProducts: Object.keys(todayProducts).length,
      date: today.toISOString().split('T')[0]
    };

    // Create optimized prompt for recommendations
    const prompt = `Genera recomendaciones específicas para el restaurante basadas en el análisis de ventas:

📈 COMPARACIÓN DE VENTAS:
- Hoy: $${todayTotal.toLocaleString()} COP
- Ayer: $${yesterdayTotal.toLocaleString()} COP
- Hace una semana: $${lastWeekTotal.toLocaleString()} COP
- Cambio diario: ${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(1)}%
- Cambio semanal: ${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(1)}%

📊 CAMBIOS EN PRODUCTOS (más significativos):
${productChanges.slice(0, 3).map(p => 
  `${p.name}: ${p.change >= 0 ? '+' : ''}${p.change.toFixed(1)}% (${p.today} vs ${p.yesterday} unidades)`
).join('\n')}

INSTRUCCIONES: Genera 1-2 recomendaciones específicas y accionables de máximo 200 palabras que incluyan:
1. Una acción concreta basada en los datos (promoción, ajuste de precio, estrategia de marketing)
2. Horario o período específico para implementarla
3. Métrica esperada o objetivo a lograr
4. Si hay productos con caída >20%, sugiere estrategias específicas

Formato: [ACCIÓN] - [CUANDO] - [OBJETIVO]
Sé directo y práctico.`;

    // Call OpenAI API
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
            content: 'Eres un consultor de restaurantes experto en optimización de ventas. Genera recomendaciones específicas y accionables basadas en datos reales de comparación de ventas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      }),
    });

    const openaiData = await response.json();
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
        data_context: analysisContext
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    console.log('Daily recommendation generated successfully');

    return new Response(JSON.stringify({
      recommendation,
      priority,
      data_context: analysisContext,
      recommendation_id: savedRecommendation?.id,
      daily_change: dailyChange,
      weekly_change: weeklyChange,
      top_product_changes: productChanges.slice(0, 3)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating recommendation:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate daily recommendation'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});