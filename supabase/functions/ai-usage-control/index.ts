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
    const { action, additional_credits } = await req.json();

    if (action === 'get_usage') {
      // Get current usage and limits
      const { data: limits, error: limitsError } = await supabaseClient
        .from('ai_daily_limits')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (limitsError) {
        console.error('Error fetching limits:', limitsError);
      }

      // Get today's usage breakdown
      const today = new Date().toISOString().split('T')[0];
      const { data: usage, error: usageError } = await supabaseClient
        .from('ai_usage_tracking')
        .select('question_type, tokens_consumed, cost_usd, created_at')
        .eq('restaurant_id', restaurantId)
        .eq('date', today);

      if (usageError) {
        console.error('Error fetching usage:', usageError);
      }

      // Calculate usage breakdown by type
      const usageByType = {
        chat: 0,
        analysis: 0,
        recommendation: 0
      };

      const costByType = {
        chat: 0,
        analysis: 0,
        recommendation: 0
      };

      usage?.forEach(record => {
        usageByType[record.question_type as keyof typeof usageByType]++;
        costByType[record.question_type as keyof typeof costByType] += Number(record.cost_usd);
      });

      const totalCost = Object.values(costByType).reduce((sum, cost) => sum + cost, 0);
      const totalQuestions = Object.values(usageByType).reduce((sum, count) => sum + count, 0);

      return new Response(JSON.stringify({
        limits: limits || {
          plan_type: 'basic',
          daily_limit: 10,
          current_usage: 0,
          additional_credits: 0,
          reset_date: today
        },
        usage_today: {
          total_questions: totalQuestions,
          by_type: usageByType,
          cost_by_type: costByType,
          total_cost_usd: totalCost,
          remaining: (limits?.daily_limit || 10) + (limits?.additional_credits || 0) - (limits?.current_usage || 0)
        },
        pricing: {
          basic: { daily_limit: 10, price_cop: 15000, price_usd: 3.75 },
          premium: { daily_limit: 50, price_cop: 45000, price_usd: 11.25 },
          enterprise: { daily_limit: 200, price_cop: 100000, price_usd: 25 },
          additional_credit_cop: 1000,
          additional_credit_usd: 0.25
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'add_credits') {
      // Add additional credits
      const creditsToAdd = additional_credits || 1;
      
      const { data: updatedLimits, error: updateError } = await supabaseClient
        .from('ai_daily_limits')
        .upsert({
          restaurant_id: restaurantId,
          additional_credits: creditsToAdd,
          reset_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'restaurant_id'
        })
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to add credits');
      }

      return new Response(JSON.stringify({
        success: true,
        credits_added: creditsToAdd,
        new_limits: updatedLimits
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'upgrade_plan') {
      const { plan_type } = await req.json();
      
      const planLimits = {
        basic: 10,
        premium: 50,
        enterprise: 200
      };

      const newLimit = planLimits[plan_type as keyof typeof planLimits] || 10;

      const { data: updatedLimits, error: updateError } = await supabaseClient
        .from('ai_daily_limits')
        .upsert({
          restaurant_id: restaurantId,
          plan_type,
          daily_limit: newLimit,
          reset_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'restaurant_id'
        })
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to upgrade plan');
      }

      return new Response(JSON.stringify({
        success: true,
        new_plan: plan_type,
        new_limits: updatedLimits
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'reset_daily_usage') {
      // Admin function to reset daily usage
      await supabaseClient
        .from('ai_daily_limits')
        .update({
          current_usage: 0,
          reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('restaurant_id', restaurantId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Daily usage reset successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in AI usage control:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI usage control request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});