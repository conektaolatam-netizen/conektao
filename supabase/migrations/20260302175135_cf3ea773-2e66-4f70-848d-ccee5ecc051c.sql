
-- Create onboarding_sessions table for tracking setup progress
CREATE TABLE public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  business_data JSONB DEFAULT '{}',
  whatsapp_number TEXT,
  meta_phone_id TEXT,
  meta_access_token TEXT,
  meta_verified BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding" ON public.onboarding_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_sessions_updated_at
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
