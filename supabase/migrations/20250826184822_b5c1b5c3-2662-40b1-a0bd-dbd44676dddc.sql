-- Create AI usage tracking table
CREATE TABLE public.ai_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('chat', 'analysis', 'recommendation')),
  tokens_consumed integer DEFAULT 0,
  cost_usd numeric(10,6) DEFAULT 0,
  question_text text,
  response_text text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create AI daily limits table
CREATE TABLE public.ai_daily_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE UNIQUE,
  plan_type text DEFAULT 'basic' CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
  daily_limit integer DEFAULT 10,
  current_usage integer DEFAULT 0,
  additional_credits integer DEFAULT 0,
  reset_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create AI recommendations table
CREATE TABLE public.ai_daily_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  recommendation_text text NOT NULL,
  recommendation_type text DEFAULT 'sales_optimization',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  data_context jsonb,
  is_applied boolean DEFAULT false,
  applied_at timestamp with time zone,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_tracking
CREATE POLICY "Users can view AI usage in their restaurant" 
ON public.ai_usage_tracking 
FOR SELECT 
USING (restaurant_id IN (
  SELECT profiles.restaurant_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can create AI usage records" 
ON public.ai_usage_tracking 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND restaurant_id IN (
  SELECT profiles.restaurant_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- RLS Policies for ai_daily_limits
CREATE POLICY "Users can view AI limits in their restaurant" 
ON public.ai_daily_limits 
FOR ALL 
USING (restaurant_id IN (
  SELECT profiles.restaurant_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- RLS Policies for ai_daily_recommendations
CREATE POLICY "Users can view AI recommendations in their restaurant" 
ON public.ai_daily_recommendations 
FOR ALL 
USING (restaurant_id IN (
  SELECT profiles.restaurant_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- Function to reset daily usage
CREATE OR REPLACE FUNCTION public.reset_daily_ai_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_daily_limits 
  SET current_usage = 0, reset_date = CURRENT_DATE
  WHERE reset_date < CURRENT_DATE;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_ai_limits_updated_at
BEFORE UPDATE ON public.ai_daily_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();