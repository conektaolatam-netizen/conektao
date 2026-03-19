
-- 1. Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'manual', 'web')),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  ics_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX idx_reservations_restaurant_date ON public.reservations(restaurant_id, reservation_date);
CREATE INDEX idx_reservations_status ON public.reservations(restaurant_id, status);
CREATE INDEX idx_reservations_phone ON public.reservations(restaurant_id, customer_phone);

-- 3. RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reservations for their restaurant"
  ON public.reservations FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert reservations for their restaurant"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update reservations for their restaurant"
  ON public.reservations FOR UPDATE TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 4. Service role can manage all reservations (for edge functions / webhook)
CREATE POLICY "Service role full access to reservations"
  ON public.reservations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. Add reservation_config JSONB to whatsapp_configs
ALTER TABLE public.whatsapp_configs
  ADD COLUMN IF NOT EXISTS reservation_config JSONB DEFAULT '{}'::jsonb;

-- 6. Updated_at trigger
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
