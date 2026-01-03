-- Actualizar la planta existente de Ibagué
UPDATE gas_plants 
SET name = 'Planta Satélite Ibagué',
    capacity_value = 40000,
    location_text = 'Km 5 Vía Ibagué-Armenia, Tolima - Recibe GLP líquido de cisternas. Tanque pulmón para llenado de cilindros 10, 20, 40 lbs. 2 tanques de 30m³.'
WHERE id = '16d2f67c-407b-4a91-8e73-e83cb57568ef';

-- Insertar las 2 nuevas plantas de Puerto Salgar
INSERT INTO gas_plants (id, tenant_id, name, capacity_value, capacity_unit, location_text, is_active) VALUES
-- Planta Mayorista Principal Puerto Salgar - 390,000 kg
('a1b2c3d4-0001-4000-a000-000000000001', '5713aeaf-2341-4ab3-932d-f888f2d05266', 
 'Comercializadora Mayorista Puerto Salgar', 
 390000, 'kg', 
 'Puerto Salgar, Cundinamarca - Planta Principal Mayorista. Despacha cisternas a plantas satélite. Punto de transferencia por tubería.', 
 true),

-- Planta Minorista Puerto Salgar (satélite) - 80,000 kg
('a1b2c3d4-0002-4000-a000-000000000002', '5713aeaf-2341-4ab3-932d-f888f2d05266', 
 'Planta Minorista Puerto Salgar', 
 80000, 'kg', 
 'Puerto Salgar, Cundinamarca - Planta satélite minorista. Recibe de planta mayorista. Llenado de pipetas y logística local. 2 tanques de 30m³.', 
 true);