
-- 1. Delete the duplicate Porchetta Mediana $49,000 record
DELETE FROM public.products 
WHERE id = 'ab6a127b-984a-437d-bb86-8a6582356fe4' 
AND restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755';

-- 2. Update operating hours: orders accepted from 3:40 PM (oven warm-up)
UPDATE public.whatsapp_configs 
SET operating_hours = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          operating_hours::jsonb,
          '{open_time}', '"15:40"'
        ),
        '{preparation_start}', '"15:40"'
      ),
      '{pre_order_message}', '"Podemos tomar tu pedido ahora, pero empezamos a preparar a partir de las 3:40 pm porque el horno necesita 40 minutos de calentamiento"'
    ),
    '{schedule}', '"Todos los días 3:40 PM - 11:00 PM"'
  ),
  '{accept_pre_orders}', 'true'
)
WHERE restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755';
