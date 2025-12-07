-- Create tip_distributions table
CREATE TABLE public.tip_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
  total_tip_amount NUMERIC NOT NULL,
  distribution_type TEXT NOT NULL DEFAULT 'equal',
  distributed_by UUID REFERENCES public.profiles(id),
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tip_payouts table
CREATE TABLE public.tip_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.tip_distributions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  hours_worked NUMERIC,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tip_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tip_distributions
CREATE POLICY "Users can view tip distributions in their restaurant"
ON public.tip_distributions
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create tip distributions in their restaurant"
ON public.tip_distributions
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
  AND distributed_by = auth.uid()
);

CREATE POLICY "Owner/Admin can update tip distributions"
ON public.tip_distributions
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'admin')
));

CREATE POLICY "Owner/Admin can delete tip distributions"
ON public.tip_distributions
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('owner', 'admin')
));

-- RLS Policies for tip_payouts
CREATE POLICY "Users can view tip payouts in their restaurant"
ON public.tip_payouts
FOR SELECT
USING (distribution_id IN (
  SELECT id FROM public.tip_distributions 
  WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Users can create tip payouts for their restaurant"
ON public.tip_payouts
FOR INSERT
WITH CHECK (distribution_id IN (
  SELECT id FROM public.tip_distributions 
  WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Owner/Admin can update tip payouts"
ON public.tip_payouts
FOR UPDATE
USING (distribution_id IN (
  SELECT id FROM public.tip_distributions 
  WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
));

-- Add tip distribution settings to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS tip_auto_distribute BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tip_default_distribution_type TEXT DEFAULT 'equal',
ADD COLUMN IF NOT EXISTS tip_cashier_can_distribute BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_tip_distributions_restaurant ON public.tip_distributions(restaurant_id);
CREATE INDEX idx_tip_distributions_date ON public.tip_distributions(distributed_at);
CREATE INDEX idx_tip_payouts_distribution ON public.tip_payouts(distribution_id);
CREATE INDEX idx_tip_payouts_employee ON public.tip_payouts(employee_id);
CREATE INDEX idx_tip_payouts_status ON public.tip_payouts(status);