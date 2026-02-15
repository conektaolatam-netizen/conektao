
-- Add daily_overrides column to whatsapp_configs
ALTER TABLE public.whatsapp_configs ADD COLUMN IF NOT EXISTS daily_overrides JSONB DEFAULT '[]'::jsonb;

-- Update La Barra config with structured hours, history, and custom rules
UPDATE public.whatsapp_configs 
SET 
  operating_hours = '{
    "open_time": "15:00",
    "close_time": "23:00",
    "days": ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"],
    "accept_pre_orders": true,
    "preparation_start": "15:30",
    "pre_order_message": "Podemos tomar tu pedido ahora, pero empezamos a preparar a partir de las 3:30 pm",
    "schedule": "Todos los días 3:00 PM - 11:00 PM",
    "peak_hours": "Viernes y Sábado 6-10PM",
    "may_extend": true
  }'::jsonb,
  restaurant_description = 'La Barra Crea Tu Pizza nació durante la pandemia, cuando Santiago Cuartas Hernández y su familia descubrieron una nueva pasión: preparar pizza. Entre risas, intentos fallidos y pequeños logros, la técnica fue mejorando hasta que recibieron un regalo inesperado: el mejor pizzero del mundo llegó desde Italia a Colombia. Fueron 15 días intensos de aprendizaje, donde les enseñó su receta ganadora para crear la auténtica masa italiana. Esa misma receta es la que hoy sirven en cada pizza. Santiago se lanzó a su primera empresa a los 16 años, acompañado del apoyo incondicional de su mamá, quien le enseñó que la calidad marca la diferencia. Hoy, además de perfeccionar la pizza, su objetivo es formarse profesionalmente y motivar a otros jóvenes a emprender.',
  custom_rules = ARRAY[
    'Las únicas sedes oficiales son La Samaria y El Vergel',
    'La Estación es una franquicia en proceso legal de retiro de marca. NO representa la experiencia oficial de La Barra',
    'Si mencionan La Estación con queja: responder con empatía, explicar que es franquicia que no sigue estándares, pedir disculpas, invitar a sedes oficiales',
    'Nunca defender el servicio de la franquicia La Estación',
    'Nunca culpar al cliente por experiencia en La Estación',
    'Fundador: Santiago Cuartas Hernández',
    'Tono ante quejas de La Estación: empático, transparente, responsable, profesional'
  ]::text[],
  daily_overrides = '[]'::jsonb
WHERE restaurant_id = (SELECT id FROM public.restaurants WHERE name ILIKE '%barra%' LIMIT 1);
