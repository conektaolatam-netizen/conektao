INSERT INTO whatsapp_configs (
  restaurant_id,
  whatsapp_phone_number_id,
  whatsapp_access_token,
  verify_token,
  order_email,
  delivery_enabled,
  is_active,
  greeting_message,
  promoted_products
) VALUES (
  '899cb7a7-7de1-47c7-a684-f24658309755',
  '940522909146874',
  'ENV_SECRET',
  'conektao_alicia_2026',
  'labarracreatupizzacierre@gmail.com',
  true,
  true,
  '¡Hola! 👋 Soy ALICIA, tu asistente de La Barra Crea Tu Pizza. ¿En qué puedo ayudarte hoy?',
  '{}'::text[]
);