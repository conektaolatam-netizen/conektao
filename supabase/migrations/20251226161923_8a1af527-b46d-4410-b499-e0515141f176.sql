-- Crear perfil faltante para el usuario de pruebas que no tenía perfil
-- Esto corrige el problema de comandas que no aparecían en cocina
INSERT INTO profiles (id, email, restaurant_id, role, full_name, is_active, created_at, account_type)
VALUES (
  'f3621053-d055-4551-822d-99f8867217ab',
  'pruebasconektao2@gmail.com',
  '015e35ec-bb82-4522-a40d-f762b0f91556',
  'admin',
  'Pruebas Conektao',
  true,
  NOW(),
  'restaurant'
)
ON CONFLICT (id) DO UPDATE SET
  restaurant_id = EXCLUDED.restaurant_id,
  is_active = true;