-- Eliminar perfiles duplicados incorrectos
-- Mantener solo el perfil correcto vinculado a "La Barra"

-- Verificar datos relacionados antes de eliminar
-- Si hay datos relacionados, esta consulta fallará y nos diremos qué limpiar primero

-- Eliminar los 3 perfiles duplicados que no tienen restaurant_id
DELETE FROM public.profiles 
WHERE id IN (
  'da0f9050-7b2f-42d3-b400-7255fcd377bf',
  '9bdcb321-867e-4896-ba88-8ab53c8b0dc1',
  'f972b49d-159b-4813-b289-bd4c30d1366b'
) 
AND restaurant_id IS NULL;