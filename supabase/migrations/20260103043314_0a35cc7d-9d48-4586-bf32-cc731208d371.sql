-- GAS SIMULATION DATA - FIXED MOVEMENT TYPE

DO $$
DECLARE
  v_tenant_id UUID;
  v_plant_id UUID;
  v_vehicle_1_id UUID;
  v_vehicle_2_id UUID;
  v_vehicle_3_id UUID;
  v_route_1_id UUID;
  v_route_2_id UUID;
  v_route_3_id UUID;
  v_client_ids UUID[];
BEGIN
  SELECT id INTO v_tenant_id FROM public.restaurants WHERE name ILIKE '%envagas%' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Envagas tenant not found';
    RETURN;
  END IF;

  -- 1. CREATE PLANT IF NOT EXISTS
  INSERT INTO public.gas_plants (tenant_id, name, location_text, capacity_value, capacity_unit, is_active)
  VALUES (v_tenant_id, 'Planta Principal Ibagué', 'Km 5 Vía Ibagué-Armenia, Tolima', 50000, 'kg', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_plant_id;
  
  IF v_plant_id IS NULL THEN
    SELECT id INTO v_plant_id FROM public.gas_plants WHERE tenant_id = v_tenant_id LIMIT 1;
  END IF;

  -- 2. CREATE 3 VEHICLES
  INSERT INTO public.gas_vehicles (tenant_id, plate, capacity_value, capacity_unit, driver_name, driver_phone, is_active)
  VALUES 
    (v_tenant_id, 'TIB-001', 2500, 'kg', 'Carlos Rodríguez', '3001234567', true),
    (v_tenant_id, 'TIB-002', 2500, 'kg', 'Miguel Ángel López', '3009876543', true),
    (v_tenant_id, 'TIB-003', 2000, 'kg', 'Juan David Martínez', '3005551234', true)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_vehicle_1_id FROM public.gas_vehicles WHERE tenant_id = v_tenant_id AND plate = 'TIB-001';
  SELECT id INTO v_vehicle_2_id FROM public.gas_vehicles WHERE tenant_id = v_tenant_id AND plate = 'TIB-002';
  SELECT id INTO v_vehicle_3_id FROM public.gas_vehicles WHERE tenant_id = v_tenant_id AND plate = 'TIB-003';

  -- 3. CREATE CLIENTS 
  DELETE FROM public.gas_clients WHERE tenant_id = v_tenant_id;
  
  INSERT INTO public.gas_clients (tenant_id, name, contact_name, contact_phone, address, city, client_type, status, notes)
  VALUES
    (v_tenant_id, 'Restaurante El Jordán', 'María García', '3101234567', 'Calle 60 # 5-32, Barrio El Jordán', 'Ibagué', 'contract', 'active', 'lat:4.4635,lng:-75.2165'),
    (v_tenant_id, 'Asadero La Fogata', 'Pedro Ramírez', '3112345678', 'Av. Ambalá # 42-15', 'Ibagué', 'contract', 'active', 'lat:4.4589,lng:-75.2098'),
    (v_tenant_id, 'Hotel Dann Carlton', 'Luis Torres', '3123456789', 'Carrera 2A # 22-35', 'Ibagué', 'contract', 'active', 'lat:4.4542,lng:-75.2234'),
    (v_tenant_id, 'Panadería La Espiga', 'Ana Martínez', '3134567890', 'Calle 42 # 3-18, La Francia', 'Ibagué', 'free', 'active', 'lat:4.4501,lng:-75.2187'),
    (v_tenant_id, 'Pizzería Napoli', 'Carlos Gómez', '3145678901', 'Carrera 5 # 38-24', 'Ibagué', 'free', 'active', 'lat:4.4478,lng:-75.2156'),
    (v_tenant_id, 'Hotel Lusitania', 'Sandra López', '3156789012', 'Calle 14 # 2-60, Centro', 'Ibagué', 'contract', 'active', 'lat:4.4385,lng:-75.2318'),
    (v_tenant_id, 'Restaurante Belén', 'Jorge Herrera', '3167890123', 'Carrera 3 # 11-45, Belén', 'Ibagué', 'contract', 'active', 'lat:4.4356,lng:-75.2287'),
    (v_tenant_id, 'Cafetería La Pola', 'Diana Vargas', '3178901234', 'Calle 10 # 4-23, La Pola', 'Ibagué', 'free', 'active', 'lat:4.4321,lng:-75.2345'),
    (v_tenant_id, 'Churrería El Español', 'Manuel Ortiz', '3189012345', 'Carrera 4 # 15-12, Centro', 'Ibagué', 'free', 'active', 'lat:4.4367,lng:-75.2298'),
    (v_tenant_id, 'Sazón Tolimense', 'Rosa Méndez', '3190123456', 'Calle 12 # 5-67, Centro', 'Ibagué', 'contract', 'active', 'lat:4.4345,lng:-75.2276'),
    (v_tenant_id, 'Finca El Salado', 'Andrés Castro', '3201234567', 'Vereda El Salado, Km 3', 'Ibagué', 'contract', 'active', 'lat:4.4198,lng:-75.2412'),
    (v_tenant_id, 'Restaurante Cádiz', 'Patricia Rojas', '3212345678', 'Carrera 9 # 34-56, Cádiz', 'Ibagué', 'contract', 'active', 'lat:4.4145,lng:-75.2378'),
    (v_tenant_id, 'Asadero Picaleña', 'Roberto Silva', '3223456789', 'Calle 69 Sur # 8-23, Picaleña', 'Ibagué', 'free', 'active', 'lat:4.4087,lng:-75.2456'),
    (v_tenant_id, 'Hotel Campestre Los Arrayanes', 'Carmen Díaz', '3234567890', 'Km 7 Vía Ibagué-Armenia', 'Ibagué', 'contract', 'active', 'lat:4.4023,lng:-75.2512'),
    (v_tenant_id, 'Hacienda Santa Rosa', 'Felipe Moreno', '3245678901', 'Vereda Santa Rosa', 'Ibagué', 'contract', 'active', 'lat:4.3978,lng:-75.2567');

  SELECT ARRAY_AGG(id ORDER BY name) INTO v_client_ids FROM public.gas_clients WHERE tenant_id = v_tenant_id;

  -- 4. DELETE EXISTING ROUTES AND CREATE NEW ONES
  DELETE FROM public.gas_routes WHERE tenant_id = v_tenant_id;
  
  INSERT INTO public.gas_routes (tenant_id, route_number, plant_id, vehicle_id, status, planned_date, started_at, assigned_qty, assigned_unit, notes)
  VALUES (v_tenant_id, 'R-NORTE-001', v_plant_id, v_vehicle_1_id, 'in_progress', CURRENT_DATE, NOW() - INTERVAL '2 hours', 2000, 'kg', 'Ruta zona norte Ibagué')
  RETURNING id INTO v_route_1_id;

  INSERT INTO public.gas_routes (tenant_id, route_number, plant_id, vehicle_id, status, planned_date, started_at, assigned_qty, assigned_unit, notes)
  VALUES (v_tenant_id, 'R-CENTRO-001', v_plant_id, v_vehicle_2_id, 'in_progress', CURRENT_DATE, NOW() - INTERVAL '3 hours', 2200, 'kg', 'Ruta zona centro Ibagué')
  RETURNING id INTO v_route_2_id;

  INSERT INTO public.gas_routes (tenant_id, route_number, plant_id, vehicle_id, status, planned_date, assigned_qty, assigned_unit, notes)
  VALUES (v_tenant_id, 'R-SUR-001', v_plant_id, v_vehicle_3_id, 'planned', CURRENT_DATE, 1800, 'kg', 'Ruta zona sur Ibagué')
  RETURNING id INTO v_route_3_id;

  -- 5. CREATE DELIVERIES
  INSERT INTO public.gas_deliveries (tenant_id, route_id, client_id, delivery_order, planned_qty, unit, status, delivered_qty, delivered_at, receiver_name, location_lat, location_lng)
  VALUES
    (v_tenant_id, v_route_1_id, v_client_ids[1], 1, 300, 'kg', 'delivered', 300, NOW() - INTERVAL '90 minutes', 'María García', 4.4635, -75.2165),
    (v_tenant_id, v_route_1_id, v_client_ids[2], 2, 450, 'kg', 'delivered', 450, NOW() - INTERVAL '60 minutes', 'Pedro Ramírez', 4.4589, -75.2098),
    (v_tenant_id, v_route_1_id, v_client_ids[3], 3, 500, 'kg', 'pending', NULL, NULL, NULL, 4.4542, -75.2234),
    (v_tenant_id, v_route_1_id, v_client_ids[4], 4, 350, 'kg', 'pending', NULL, NULL, NULL, 4.4501, -75.2187),
    (v_tenant_id, v_route_1_id, v_client_ids[5], 5, 400, 'kg', 'pending', NULL, NULL, NULL, 4.4478, -75.2156);

  INSERT INTO public.gas_deliveries (tenant_id, route_id, client_id, delivery_order, planned_qty, unit, status, delivered_qty, delivered_at, receiver_name, location_lat, location_lng)
  VALUES
    (v_tenant_id, v_route_2_id, v_client_ids[6], 1, 400, 'kg', 'delivered', 400, NOW() - INTERVAL '150 minutes', 'Sandra López', 4.4385, -75.2318),
    (v_tenant_id, v_route_2_id, v_client_ids[7], 2, 380, 'kg', 'delivered', 380, NOW() - INTERVAL '120 minutes', 'Jorge Herrera', 4.4356, -75.2287),
    (v_tenant_id, v_route_2_id, v_client_ids[8], 3, 420, 'kg', 'delivered', 420, NOW() - INTERVAL '90 minutes', 'Diana Vargas', 4.4321, -75.2345),
    (v_tenant_id, v_route_2_id, v_client_ids[9], 4, 500, 'kg', 'pending', NULL, NULL, NULL, 4.4367, -75.2298),
    (v_tenant_id, v_route_2_id, v_client_ids[10], 5, 500, 'kg', 'pending', NULL, NULL, NULL, 4.4345, -75.2276);

  INSERT INTO public.gas_deliveries (tenant_id, route_id, client_id, delivery_order, planned_qty, unit, status, location_lat, location_lng)
  VALUES
    (v_tenant_id, v_route_3_id, v_client_ids[11], 1, 350, 'kg', 'pending', 4.4198, -75.2412),
    (v_tenant_id, v_route_3_id, v_client_ids[12], 2, 400, 'kg', 'pending', 4.4145, -75.2378),
    (v_tenant_id, v_route_3_id, v_client_ids[13], 3, 350, 'kg', 'pending', 4.4087, -75.2456),
    (v_tenant_id, v_route_3_id, v_client_ids[14], 4, 380, 'kg', 'pending', 4.4023, -75.2512),
    (v_tenant_id, v_route_3_id, v_client_ids[15], 5, 320, 'kg', 'pending', 4.3978, -75.2567);

  -- 6. CREATE REAL ANOMALIES
  DELETE FROM public.gas_anomalies WHERE tenant_id = v_tenant_id;
  
  INSERT INTO public.gas_anomalies (tenant_id, anomaly_type, route_id, severity, status, title, description)
  VALUES
    (v_tenant_id, 'inventory_discrepancy', v_route_1_id, 'high', 'new', 'Diferencia de inventario detectada', 'Se detectó una diferencia de 45 kg entre el inventario esperado y el real en el vehículo TIB-001.'),
    (v_tenant_id, 'delivery_delay', v_route_2_id, 'medium', 'new', 'Retraso en entregas zona Centro', 'La ruta R-CENTRO-001 lleva 45 minutos de retraso respecto al horario planificado.'),
    (v_tenant_id, 'client_blocked', NULL, 'low', 'new', 'Cliente bloqueado intentó realizar pedido', 'El cliente Distribuciones López (bloqueado por mora) intentó realizar un pedido de 500 kg.'),
    (v_tenant_id, 'gas_leak', v_route_1_id, 'critical', 'in_review', 'Posible fuga reportada en vehículo TIB-001', 'El conductor Carlos Rodríguez reportó olor a gas cerca de la válvula principal. Vehículo detenido para inspección.'),
    (v_tenant_id, 'payment_overdue', NULL, 'high', 'new', 'Cartera vencida supera umbral crítico', 'La cartera vencida a más de 60 días alcanzó $12,500,000 COP, superando el umbral de $10,000,000.');

  -- 7. ADD INVENTORY TO PLANT (using 'entry' which is valid)
  INSERT INTO public.gas_inventory_ledger (tenant_id, plant_id, movement_type, qty, unit, notes)
  VALUES (v_tenant_id, v_plant_id, 'entry', 25000, 'kg', 'Carga inicial de inventario planta');

  RAISE NOTICE 'GAS simulation data created successfully for tenant %', v_tenant_id;
END $$;