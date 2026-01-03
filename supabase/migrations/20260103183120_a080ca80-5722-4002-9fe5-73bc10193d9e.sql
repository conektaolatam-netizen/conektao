-- Actualizar capacidades correctas de las plantas existentes
UPDATE gas_plants 
SET capacity_value = 460000,
    name = 'Planta Madre Puerto Salgar',
    location_text = 'Puerto Salgar, Cundinamarca - Planta madre ENVAGAS con más de 460t de capacidad. Centro de distribución principal. Despacha cisternas a plantas satélite y distribución por tubería.'
WHERE id = 'a1b2c3d4-0001-4000-a000-000000000001';

UPDATE gas_plants 
SET capacity_value = 45000,
    name = 'Planta Operativa Puerto Salgar',
    location_text = 'Puerto Salgar, Cundinamarca - Planta operativa para distribución local. Llenado de cilindros y pipetas. Control de inventario local.'
WHERE id = 'a1b2c3d4-0002-4000-a000-000000000002';

UPDATE gas_plants 
SET capacity_value = 35000,
    name = 'Planta Satélite Ibagué',
    location_text = 'Ibagué, Tolima - Planta satélite para distribución regional. Recibe GLP de cisternas. Llenado de cilindros 10, 20, 40 lbs.'
WHERE id = '16d2f67c-407b-4a91-8e73-e83cb57568ef';

-- Crear las mismas plantas para el otro tenant de Envagas
INSERT INTO gas_plants (id, tenant_id, name, capacity_value, capacity_unit, location_text, is_active)
VALUES 
  ('b1c2d3e4-0001-4000-b000-000000000001', 'e7a93c00-0000-4000-a000-000000000001', 
   'Planta Madre Puerto Salgar', 460000, 'kg', 
   'Puerto Salgar, Cundinamarca - Planta madre ENVAGAS con más de 460t de capacidad. Centro de distribución principal. Despacha cisternas a plantas satélite y distribución por tubería.', true),
   
  ('b1c2d3e4-0002-4000-b000-000000000002', 'e7a93c00-0000-4000-a000-000000000001', 
   'Planta Operativa Puerto Salgar', 45000, 'kg', 
   'Puerto Salgar, Cundinamarca - Planta operativa para distribución local. Llenado de cilindros y pipetas. Control de inventario local.', true),
   
  ('b1c2d3e4-0003-4000-b000-000000000003', 'e7a93c00-0000-4000-a000-000000000001', 
   'Planta Satélite Ibagué', 35000, 'kg', 
   'Ibagué, Tolima - Planta satélite para distribución regional. Recibe GLP de cisternas. Llenado de cilindros 10, 20, 40 lbs.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity_value = EXCLUDED.capacity_value,
  location_text = EXCLUDED.location_text;

-- Insertar inventario inicial para las nuevas plantas
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes)
VALUES 
  -- Planta Madre: 380,000 kg (82% de 460,000)
  ('e7a93c00-0000-4000-a000-000000000001', 'b1c2d3e4-0001-4000-b000-000000000001', 
   'entry', 380000, 'kg', 'Inventario inicial - Planta Madre Puerto Salgar'),
   
  -- Planta Operativa: 38,000 kg (84% de 45,000)
  ('e7a93c00-0000-4000-a000-000000000001', 'b1c2d3e4-0002-4000-b000-000000000002', 
   'entry', 38000, 'kg', 'Inventario inicial - Planta Operativa Puerto Salgar'),
   
  -- Planta Ibagué: 28,000 kg (80% de 35,000)
  ('e7a93c00-0000-4000-a000-000000000001', 'b1c2d3e4-0003-4000-b000-000000000003', 
   'entry', 28000, 'kg', 'Inventario inicial - Planta Satélite Ibagué');