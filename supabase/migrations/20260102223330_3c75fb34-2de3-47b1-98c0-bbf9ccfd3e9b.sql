-- =====================================================
-- ENVAGAS TENANT SETUP - GAS MODE
-- =====================================================

-- 1. Create Envagas restaurant with product_mode='gas'
INSERT INTO public.restaurants (
  id,
  name,
  address,
  product_mode,
  location_radius,
  owner_id
) VALUES (
  'e7a93c00-0000-4000-a000-000000000001',
  'Envagas - Distribuidora GLP',
  'Bogotá, Colombia',
  'gas',
  1000,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO UPDATE SET
  product_mode = 'gas',
  name = 'Envagas - Distribuidora GLP';

-- 2. Create sample gas plant
INSERT INTO public.gas_plants (
  id,
  tenant_id,
  name,
  location_text,
  capacity_value,
  capacity_unit,
  is_active
) VALUES (
  'e7a93c00-0001-4000-a000-000000000001',
  'e7a93c00-0000-4000-a000-000000000001',
  'Planta Principal Bogotá',
  'Zona Industrial Norte, Bogotá',
  50000,
  'kg',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Create sample vehicles
INSERT INTO public.gas_vehicles (tenant_id, plate, capacity_value, capacity_unit, driver_name, is_active)
VALUES 
  ('e7a93c00-0000-4000-a000-000000000001', 'ABC-123', 2000, 'kg', 'Carlos Rodríguez', true),
  ('e7a93c00-0000-4000-a000-000000000001', 'DEF-456', 1500, 'kg', 'Miguel Sánchez', true),
  ('e7a93c00-0000-4000-a000-000000000001', 'GHI-789', 2500, 'kg', 'Juan Pérez', true)
ON CONFLICT DO NOTHING;

-- 4. Create sample clients
INSERT INTO public.gas_clients (tenant_id, name, contact_name, contact_phone, address, city, client_type, status)
VALUES 
  ('e7a93c00-0000-4000-a000-000000000001', 'Restaurante El Sabor', 'María García', '3001234567', 'Calle 80 #15-20', 'Bogotá', 'contract', 'active'),
  ('e7a93c00-0000-4000-a000-000000000001', 'Hotel Las Palmas', 'Pedro Martínez', '3009876543', 'Carrera 7 #45-10', 'Bogotá', 'contract', 'active'),
  ('e7a93c00-0000-4000-a000-000000000001', 'Panadería La Esperanza', 'Ana López', '3005551234', 'Av. Caracas #25-30', 'Bogotá', 'free', 'active'),
  ('e7a93c00-0000-4000-a000-000000000001', 'Asadero Don Julio', 'Julio Hernández', '3007778899', 'Calle 100 #8-50', 'Bogotá', 'contract', 'active'),
  ('e7a93c00-0000-4000-a000-000000000001', 'Cafetería Central', 'Carmen Ruiz', '3002223344', 'Carrera 15 #60-15', 'Bogotá', 'free', 'active')
ON CONFLICT DO NOTHING;

-- 5. Create initial inventory entry (gas received at plant)
INSERT INTO public.gas_inventory_ledger (
  tenant_id,
  plant_id,
  movement_type,
  qty,
  unit,
  reference_type,
  notes
) VALUES (
  'e7a93c00-0000-4000-a000-000000000001',
  'e7a93c00-0001-4000-a000-000000000001',
  'entry',
  15000,
  'kg',
  'manual',
  'Inventario inicial de planta'
) ON CONFLICT DO NOTHING;

-- 6. Create default price rule
INSERT INTO public.gas_price_rules (
  tenant_id,
  scope,
  unit,
  price_per_unit,
  is_active,
  effective_from
) VALUES (
  'e7a93c00-0000-4000-a000-000000000001',
  'global',
  'kg',
  3500,
  true,
  CURRENT_DATE
) ON CONFLICT DO NOTHING;