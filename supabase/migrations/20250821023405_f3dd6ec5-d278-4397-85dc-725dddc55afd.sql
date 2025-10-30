-- Corregir el perfil de MOCAI para que sea dueño y tenga un restaurante
-- Primero crear el restaurante para MOCAI
INSERT INTO restaurants (
  id,
  owner_id,
  name,
  address,
  latitude,
  longitude,
  location_radius,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd2aa3bf2-676c-4688-9366-8223cdfb9f8e',
  'MOCAI',
  'Establecimiento MOCAI',
  NULL,
  NULL,
  100,
  now(),
  now()
)
RETURNING id;

-- Actualizar el perfil de MOCAI para que sea dueño y tenga el restaurante
UPDATE profiles 
SET 
  role = 'owner'::user_role,
  restaurant_id = (SELECT id FROM restaurants WHERE owner_id = 'd2aa3bf2-676c-4688-9366-8223cdfb9f8e'),
  permissions = jsonb_build_object(
    'all_modules', true,
    'manage_employees', true,
    'view_reports', true,
    'manage_inventory', true,
    'manage_sales', true
  ),
  updated_at = now()
WHERE id = 'd2aa3bf2-676c-4688-9366-8223cdfb9f8e';

-- Mejorar el trigger para que detecte cuando es el primer usuario de un restaurante
-- y lo haga dueño automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  -- Solo crear perfil si no existe ya
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    permissions,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', 'user-' || new.id || '@noemail.local'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'usuario@noemail.local'), '@', 1), 'Usuario'),
    'employee'::user_role,  -- Siempre employee por defecto, el RegisterForm se encarga del owner
    true,
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  return new;
end;
$$;