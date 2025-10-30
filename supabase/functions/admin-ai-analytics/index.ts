import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get admin-specific analytics
    const today = new Date().toISOString().split('T')[0];
    
    // Get all AI usage for today across all restaurants
    const { data: allUsage, error: usageError } = await supabaseClient
      .from('ai_usage_tracking')
      .select('*')
      .eq('date', today);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
    }

    // Get restaurant count
    const { data: restaurants, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('id');

    if (restaurantError) {
      console.error('Error fetching restaurants:', restaurantError);
    }

    // Calculate analytics
    const totalQuestions = allUsage?.length || 0;
    const totalCost = allUsage?.reduce((sum, item) => sum + Number(item.cost_usd), 0) || 0;
    const activeRestaurants = new Set(allUsage?.map(item => item.restaurant_id)).size;
    
    const usageByType = {
      chat: allUsage?.filter(item => item.question_type === 'chat').length || 0,
      analysis: allUsage?.filter(item => item.question_type === 'analysis').length || 0,
      recommendation: allUsage?.filter(item => item.question_type === 'recommendation').length || 0
    };

    const costByType = {
      chat: allUsage?.filter(item => item.question_type === 'chat').reduce((sum, item) => sum + Number(item.cost_usd), 0) || 0,
      analysis: allUsage?.filter(item => item.question_type === 'analysis').reduce((sum, item) => sum + Number(item.cost_usd), 0) || 0,
      recommendation: allUsage?.filter(item => item.question_type === 'recommendation').reduce((sum, item) => sum + Number(item.cost_usd), 0) || 0
    };

    const mostUsedFunction = Object.entries(usageByType).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Get trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weeklyUsage } = await supabaseClient
      .from('ai_usage_tracking')
      .select('date, cost_usd')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    const dailyTrends = {};
    weeklyUsage?.forEach(item => {
      if (!dailyTrends[item.date]) {
        dailyTrends[item.date] = 0;
      }
      dailyTrends[item.date] += Number(item.cost_usd);
    });

    console.log('Admin analytics calculated successfully');

    return new Response(JSON.stringify({
      totalQuestions,
      totalCost,
      activeRestaurants,
      totalRestaurants: restaurants?.length || 0,
      usageByType,
      costByType,
      mostUsedFunction,
      avgQuestionsPerRestaurant: activeRestaurants > 0 ? totalQuestions / activeRestaurants : 0,
      avgCostPerQuestion: totalQuestions > 0 ? totalCost / totalQuestions : 0,
      dailyTrends,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin analytics:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate admin analytics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});