-- Inventario inicial para Comercializadora Mayorista Puerto Salgar (320,000 kg de 390,000 kg capacidad)
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at)
VALUES (
  '5713aeaf-2341-4ab3-932d-f888f2d05266',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'entry',
  320000,
  'kg',
  'Inventario inicial - Planta Mayorista Puerto Salgar',
  now() - interval '7 days'
);

-- Inventario inicial para Planta Minorista Puerto Salgar (65,000 kg de 80,000 kg capacidad)
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at)
VALUES (
  '5713aeaf-2341-4ab3-932d-f888f2d05266',
  'a1b2c3d4-0002-4000-a000-000000000002',
  'entry',
  65000,
  'kg',
  'Inventario inicial - Planta Minorista Puerto Salgar',
  now() - interval '7 days'
);

-- Movimientos de salida simulados para los últimos 7 días - Mayorista Puerto Salgar (using 'exit' instead of 'dispatch')
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at) VALUES
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -10500, 'kg', 'Despacho cisterna a Ibagué', now() - interval '6 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -8200, 'kg', 'Despacho cisterna a planta minorista', now() - interval '5 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -11800, 'kg', 'Despacho cisterna a Ibagué', now() - interval '4 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -9500, 'kg', 'Despacho cisterna a planta minorista', now() - interval '3 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -7800, 'kg', 'Despacho cisterna cliente mayorista', now() - interval '2 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0001-4000-a000-000000000001', 'exit', -12300, 'kg', 'Despacho cisterna a Ibagué', now() - interval '1 day');

-- Movimientos de salida - Minorista Puerto Salgar
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at) VALUES
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -2800, 'kg', 'Llenado pipetas distribución local', now() - interval '6 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -3100, 'kg', 'Llenado tanques estacionarios', now() - interval '5 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -2450, 'kg', 'Llenado pipetas distribución local', now() - interval '4 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -3600, 'kg', 'Llenado tanques y pipetas', now() - interval '3 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -2200, 'kg', 'Llenado pipetas', now() - interval '2 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'exit', -2900, 'kg', 'Llenado distribución local', now() - interval '1 day');

-- Recepciones en planta minorista (desde mayorista)
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at) VALUES
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'entry', 8150, 'kg', 'Recepción cisterna desde Puerto Salgar', now() - interval '5 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', 'a1b2c3d4-0002-4000-a000-000000000002', 'entry', 9450, 'kg', 'Recepción cisterna desde Puerto Salgar', now() - interval '3 days');

-- Movimientos de salida - Ibagué
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at) VALUES
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -1850, 'kg', 'Llenado cilindros 10-40 lbs', now() - interval '6 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -2100, 'kg', 'Llenado cilindros distribución', now() - interval '5 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -1650, 'kg', 'Llenado cilindros 10-40 lbs', now() - interval '4 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -2300, 'kg', 'Llenado cilindros distribución', now() - interval '3 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -1900, 'kg', 'Llenado cilindros 10-40 lbs', now() - interval '2 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'exit', -2050, 'kg', 'Llenado cilindros distribución', now() - interval '1 day');

-- Recepciones en Ibagué (desde mayorista)
INSERT INTO gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes, created_at) VALUES
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'entry', 10400, 'kg', 'Recepción cisterna desde Puerto Salgar', now() - interval '6 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'entry', 11700, 'kg', 'Recepción cisterna desde Puerto Salgar', now() - interval '4 days'),
('5713aeaf-2341-4ab3-932d-f888f2d05266', '16d2f67c-407b-4a91-8e73-e83cb57568ef', 'entry', 12200, 'kg', 'Recepción cisterna desde Puerto Salgar', now() - interval '1 day');