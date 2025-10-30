-- Create monthly sales targets table
CREATE TABLE public.monthly_sales_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_sales_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly sales targets
CREATE POLICY "Users can manage targets in their restaurant"
ON public.monthly_sales_targets
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid() AND 
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Create subscription settings table
CREATE TABLE public.subscription_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'basic',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  auto_renew boolean NOT NULL DEFAULT true,
  service_charge_enabled boolean NOT NULL DEFAULT false,
  service_charge_percentage numeric DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription settings
CREATE POLICY "Restaurant owners can manage subscription settings"
ON public.subscription_settings
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_monthly_sales_targets_updated_at
BEFORE UPDATE ON public.monthly_sales_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_settings_updated_at
BEFORE UPDATE ON public.subscription_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();