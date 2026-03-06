
CREATE TABLE public.system_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  value TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners/admins can manage overrides"
  ON public.system_overrides FOR ALL TO authenticated
  USING (public.can_manage_restaurant(restaurant_id))
  WITH CHECK (public.can_manage_restaurant(restaurant_id));

CREATE POLICY "Service role full access"
  ON public.system_overrides FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_system_overrides_restaurant ON public.system_overrides(restaurant_id);
CREATE INDEX idx_system_overrides_active ON public.system_overrides(restaurant_id, end_time);
