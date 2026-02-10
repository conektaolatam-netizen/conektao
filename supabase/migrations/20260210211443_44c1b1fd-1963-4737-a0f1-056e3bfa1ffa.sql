
-- Update whatsapp_configs for La Barra with new phone number and full config
UPDATE whatsapp_configs 
SET 
  whatsapp_phone_number_id = '942285825640689',
  order_email = 'labarracreatupizza@gmail.com',
  greeting_message = '¡Hola! 👋 Soy ALICIA, la asistente virtual de La Barra Crea Tu Pizza en Ibagué. ¿En qué te puedo ayudar?',
  promoted_products = ARRAY[
    'Nuditos de Ajo - recién salidos del horno, son deliciosos',
    'Pizza Diavola - espectacular, una de nuestras mejores',
    'Pizza La Barra - ganadora del Pizza Master de Tulio Recomienda, combinación perfecta entre dulce, salado y un poquito de picante',
    'Sodificada de Lychee y Fresa - espectacular y refrescante',
    'Aperol Spritz - alianza especial a solo $25.000',
    'Copa de Vino - perfecta con pizzas premium',
    'Sangría de Vino Tinto en copa - muy famosa en La Barra'
  ],
  delivery_enabled = true,
  updated_at = now()
WHERE restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755';
