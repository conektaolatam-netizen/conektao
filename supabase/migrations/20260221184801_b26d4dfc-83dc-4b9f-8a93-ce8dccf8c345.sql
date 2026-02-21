
-- Change default plan_type for new restaurants to 'alicia_only'
ALTER TABLE public.subscription_settings ALTER COLUMN plan_type SET DEFAULT 'alicia_only';

-- Create module_interest_requests table
CREATE TABLE public.module_interest_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  module_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id, module_key)
);

-- Enable RLS
ALTER TABLE public.module_interest_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interest requests
CREATE POLICY "Users can insert own interest requests"
ON public.module_interest_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own interest requests
CREATE POLICY "Users can view own interest requests"
ON public.module_interest_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Restaurant owners can view all interest requests for their restaurant
CREATE POLICY "Owners can view restaurant interest requests"
ON public.module_interest_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  )
);
