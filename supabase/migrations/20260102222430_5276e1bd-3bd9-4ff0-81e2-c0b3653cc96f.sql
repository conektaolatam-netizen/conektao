-- =====================================================
-- CONEKTAO GAS - Complete Migration
-- Isolated tenant system for gas distribution
-- =====================================================

-- 1. Add product_mode to restaurants (feature flag)
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS product_mode TEXT DEFAULT 'restaurant' 
CHECK (product_mode IN ('restaurant', 'gas'));

-- 2. Create GAS Plants table
CREATE TABLE IF NOT EXISTS public.gas_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_text TEXT,
  capacity_value NUMERIC,
  capacity_unit TEXT DEFAULT 'kg',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create GAS Vehicles table
CREATE TABLE IF NOT EXISTS public.gas_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  capacity_value NUMERIC NOT NULL,
  capacity_unit TEXT DEFAULT 'kg' CHECK (capacity_unit IN ('kg', 'gal', 'cylinder')),
  driver_name TEXT,
  driver_phone TEXT,
  last_maintenance_date DATE,
  docs_expiry_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create GAS Clients (B2B) table
CREATE TABLE IF NOT EXISTS public.gas_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT,
  client_type TEXT DEFAULT 'free' CHECK (client_type IN ('contract', 'free')),
  contract_json JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create GAS Price Rules table
CREATE TABLE IF NOT EXISTS public.gas_price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'client', 'zone', 'product')),
  client_id UUID REFERENCES public.gas_clients(id) ON DELETE SET NULL,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'gal', 'cylinder')),
  price_per_unit NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create GAS Inventory Ledger (SINGLE SOURCE OF TRUTH)
CREATE TABLE IF NOT EXISTS public.gas_inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.gas_plants(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.gas_vehicles(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'transfer', 'delivery', 'return', 'merma', 'adjustment')),
  qty NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  reference_type TEXT,
  reference_id UUID,
  batch_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- 7. Create GAS Routes table
CREATE TABLE IF NOT EXISTS public.gas_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  route_number TEXT NOT NULL,
  plant_id UUID REFERENCES public.gas_plants(id),
  vehicle_id UUID REFERENCES public.gas_vehicles(id),
  driver_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'pending_return_review', 'closed', 'alert', 'cancelled')),
  planned_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  assigned_qty NUMERIC,
  assigned_unit TEXT DEFAULT 'kg',
  expected_return_qty NUMERIC,
  actual_return_qty NUMERIC,
  return_reviewed_by UUID REFERENCES auth.users(id),
  return_reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Create GAS Deliveries table
CREATE TABLE IF NOT EXISTS public.gas_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.gas_routes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.gas_clients(id),
  delivery_order INTEGER DEFAULT 1,
  planned_qty NUMERIC NOT NULL,
  delivered_qty NUMERIC,
  unit TEXT DEFAULT 'kg',
  unit_price NUMERIC,
  total_amount NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'partial', 'not_delivered', 'incident')),
  receiver_name TEXT,
  receiver_signature_url TEXT,
  photo_url TEXT,
  delivered_at TIMESTAMPTZ,
  incident_reason TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create GAS Payment Events (Driver does NOT enter amounts)
CREATE TABLE IF NOT EXISTS public.gas_payments_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.gas_deliveries(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'card', 'credit', 'no_pay')),
  proof_url TEXT,
  collected_by_driver BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create GAS AR Ledger (Accounts Receivable - Cartera)
CREATE TABLE IF NOT EXISTS public.gas_ar_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.gas_clients(id),
  delivery_id UUID REFERENCES public.gas_deliveries(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('invoice', 'payment', 'adjustment', 'credit_note')),
  amount NUMERIC NOT NULL,
  method TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed', 'cancelled')),
  due_date DATE,
  matched_at TIMESTAMPTZ,
  matched_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create GAS Anomalies table
CREATE TABLE IF NOT EXISTS public.gas_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  route_id UUID REFERENCES public.gas_routes(id),
  delivery_id UUID REFERENCES public.gas_deliveries(id),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved', 'dismissed')),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  details_json JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Create GAS Orders (Marketplace/Pedidos)
CREATE TABLE IF NOT EXISTS public.gas_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.gas_clients(id),
  requested_qty NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  requested_date DATE,
  preferred_time TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_route', 'delivered', 'cancelled')),
  delivery_id UUID REFERENCES public.gas_deliveries(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gas_plants_tenant ON public.gas_plants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_vehicles_tenant ON public.gas_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_clients_tenant ON public.gas_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_routes_tenant ON public.gas_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_routes_status ON public.gas_routes(status);
CREATE INDEX IF NOT EXISTS idx_gas_routes_driver ON public.gas_routes(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_gas_deliveries_route ON public.gas_deliveries(route_id);
CREATE INDEX IF NOT EXISTS idx_gas_deliveries_client ON public.gas_deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_gas_deliveries_status ON public.gas_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_gas_inventory_ledger_tenant ON public.gas_inventory_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_inventory_ledger_plant ON public.gas_inventory_ledger(plant_id);
CREATE INDEX IF NOT EXISTS idx_gas_inventory_ledger_vehicle ON public.gas_inventory_ledger(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gas_ar_ledger_client ON public.gas_ar_ledger(client_id);
CREATE INDEX IF NOT EXISTS idx_gas_ar_ledger_status ON public.gas_ar_ledger(status);
CREATE INDEX IF NOT EXISTS idx_gas_anomalies_tenant ON public.gas_anomalies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_anomalies_status ON public.gas_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_gas_orders_tenant ON public.gas_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gas_orders_client ON public.gas_orders(client_id);

-- 14. Enable RLS on all GAS tables
ALTER TABLE public.gas_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_payments_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_ar_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_orders ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies for GAS Plants
CREATE POLICY "gas_plants_tenant_read" ON public.gas_plants
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_plants_tenant_write" ON public.gas_plants
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 16. RLS Policies for GAS Vehicles
CREATE POLICY "gas_vehicles_tenant_read" ON public.gas_vehicles
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_vehicles_tenant_write" ON public.gas_vehicles
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 17. RLS Policies for GAS Clients
CREATE POLICY "gas_clients_tenant_read" ON public.gas_clients
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_clients_tenant_write" ON public.gas_clients
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 18. RLS Policies for GAS Price Rules
CREATE POLICY "gas_price_rules_tenant_read" ON public.gas_price_rules
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_price_rules_tenant_write" ON public.gas_price_rules
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 19. RLS Policies for GAS Inventory Ledger
CREATE POLICY "gas_inventory_ledger_tenant_read" ON public.gas_inventory_ledger
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_inventory_ledger_tenant_write" ON public.gas_inventory_ledger
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 20. RLS Policies for GAS Routes
CREATE POLICY "gas_routes_tenant_read" ON public.gas_routes
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_routes_tenant_write" ON public.gas_routes
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 21. RLS Policies for GAS Deliveries
CREATE POLICY "gas_deliveries_tenant_read" ON public.gas_deliveries
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_deliveries_tenant_write" ON public.gas_deliveries
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 22. RLS Policies for GAS Payment Events
CREATE POLICY "gas_payments_events_tenant_read" ON public.gas_payments_events
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_payments_events_tenant_write" ON public.gas_payments_events
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 23. RLS Policies for GAS AR Ledger
CREATE POLICY "gas_ar_ledger_tenant_read" ON public.gas_ar_ledger
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_ar_ledger_tenant_write" ON public.gas_ar_ledger
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 24. RLS Policies for GAS Anomalies
CREATE POLICY "gas_anomalies_tenant_read" ON public.gas_anomalies
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_anomalies_tenant_write" ON public.gas_anomalies
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 25. RLS Policies for GAS Orders
CREATE POLICY "gas_orders_tenant_read" ON public.gas_orders
  FOR SELECT USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gas_orders_tenant_write" ON public.gas_orders
  FOR ALL USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 26. Helper function to generate route numbers
CREATE OR REPLACE FUNCTION public.generate_gas_route_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_date TEXT;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.gas_routes
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN 'R-' || v_date || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

-- 27. Helper function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_gas_order_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_date TEXT;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.gas_orders
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN 'P-' || v_date || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

-- 28. Function to calculate expected return qty for a route
CREATE OR REPLACE FUNCTION public.calculate_gas_route_expected_return(p_route_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned NUMERIC;
  v_delivered NUMERIC;
BEGIN
  SELECT COALESCE(assigned_qty, 0) INTO v_assigned
  FROM public.gas_routes
  WHERE id = p_route_id;
  
  SELECT COALESCE(SUM(delivered_qty), 0) INTO v_delivered
  FROM public.gas_deliveries
  WHERE route_id = p_route_id
    AND status IN ('delivered', 'partial');
  
  RETURN v_assigned - v_delivered;
END;
$$;

-- 29. Trigger to auto-create anomaly on merma detection
CREATE OR REPLACE FUNCTION public.gas_detect_merma_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.movement_type = 'merma' THEN
    INSERT INTO public.gas_anomalies (
      tenant_id,
      anomaly_type,
      severity,
      title,
      description,
      details_json
    ) VALUES (
      NEW.tenant_id,
      'merma_detected',
      CASE 
        WHEN NEW.qty > 50 THEN 'high'
        WHEN NEW.qty > 20 THEN 'medium'
        ELSE 'low'
      END,
      'Merma detectada: ' || NEW.qty || ' ' || NEW.unit,
      NEW.notes,
      jsonb_build_object(
        'qty', NEW.qty,
        'unit', NEW.unit,
        'plant_id', NEW.plant_id,
        'vehicle_id', NEW.vehicle_id,
        'reference_id', NEW.reference_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER gas_inventory_merma_trigger
  AFTER INSERT ON public.gas_inventory_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.gas_detect_merma_anomaly();

-- 30. Updated_at trigger for GAS tables
CREATE OR REPLACE FUNCTION public.gas_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER gas_plants_updated_at BEFORE UPDATE ON public.gas_plants
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_vehicles_updated_at BEFORE UPDATE ON public.gas_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_clients_updated_at BEFORE UPDATE ON public.gas_clients
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_price_rules_updated_at BEFORE UPDATE ON public.gas_price_rules
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_routes_updated_at BEFORE UPDATE ON public.gas_routes
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_deliveries_updated_at BEFORE UPDATE ON public.gas_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_ar_ledger_updated_at BEFORE UPDATE ON public.gas_ar_ledger
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_anomalies_updated_at BEFORE UPDATE ON public.gas_anomalies
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();

CREATE TRIGGER gas_orders_updated_at BEFORE UPDATE ON public.gas_orders
  FOR EACH ROW EXECUTE FUNCTION public.gas_update_updated_at();