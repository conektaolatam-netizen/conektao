
-- Fase 1: Expand whatsapp_configs for dynamic multi-tenant configuration
ALTER TABLE public.whatsapp_configs
  ADD COLUMN IF NOT EXISTS restaurant_name text,
  ADD COLUMN IF NOT EXISTS restaurant_description text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_details text,
  ADD COLUMN IF NOT EXISTS menu_data jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS menu_link text,
  ADD COLUMN IF NOT EXISTS delivery_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS packaging_rules jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS time_estimates jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS personality_rules jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_rules jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS escalation_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_rules text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_plan text;

-- Migrate La Barra hardcoded data into the new columns
UPDATE public.whatsapp_configs
SET
  restaurant_name = 'La Barra Crea Tu Pizza',
  restaurant_description = 'Pizzería artesanal en Ibagué con pizzas al horno de leña, pastas italianas, cócteles y más',
  location_address = 'La Samaria, 44 con 5ta, Ibagué',
  location_details = 'Estamos en LA SAMARIA, en la 44 con 5ta, Ibagué. Solo tenemos esta sede.',
  menu_link = 'https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk',
  delivery_config = '{
    "enabled": true,
    "free_zones": ["Ática", "Foret", "Wakari", "Antigua", "Salento", "Fortaleza", "Mallorca", "Mangle"],
    "paid_delivery_note": "El domicilio se paga directamente al domiciliario",
    "escalation_tag": "---CONSULTA_DOMICILIO---"
  }'::jsonb,
  payment_config = '{
    "methods": ["transferencia", "efectivo", "datafono"],
    "bank_details": "Bancolombia Ahorros 718-000042-16, NIT 901684302 - LA BARRA CREA TU PIZZA",
    "require_proof": true
  }'::jsonb,
  packaging_rules = '[
    {"type": "Pizza", "cost": 2000},
    {"type": "Hamburguesa", "cost": 3000},
    {"type": "Pasta", "cost": 3000},
    {"type": "Vaso para llevar", "cost": 1000}
  ]'::jsonb,
  operating_hours = '{
    "schedule": "Todos los días",
    "peak_hours": "Viernes y Sábado 6-10PM"
  }'::jsonb,
  time_estimates = '{
    "weekday": "~15min",
    "weekend": "~15-20min",
    "peak": "~30min",
    "delivery_travel": "~25min"
  }'::jsonb,
  personality_rules = '{
    "tone": "casual_professional",
    "name": "Alicia",
    "prohibited_words": ["oki", "cositas", "ricuras", "delicias", "manjares", "antojitos"],
    "preferred_vocabulary": ["dale", "listo", "va", "claro", "bueno", "perfecto", "con gusto"],
    "rules": [
      "Primera letra MAYÚSCULA siempre",
      "No punto final en mensajes",
      "Mensajes cortos: 1-2 líneas máximo",
      "No signos de exclamación dobles",
      "Nunca decir asistente virtual, bot o IA"
    ]
  }'::jsonb,
  sales_rules = '{
    "max_suggestions_per_order": 1,
    "respect_first_no": true,
    "suggest_complements": true,
    "no_prices_in_suggestions": true
  }'::jsonb,
  escalation_config = '{
    "human_phone": "3014017559",
    "escalation_message": "Claro, comunícate al 3014017559 y con gusto te atienden 😊"
  }'::jsonb,
  custom_rules = ARRAY[
    'Solo UN sabor por pizza, NO mitad y mitad',
    'Tamaños de pizza: Personal y Mediana',
    'Crea Tu Pizza: Personal $32.000, Mediana $49.000, incluye 6 toppings → escalar a humano',
    'Burrata La Barra y Burrata Tempura son ENTRADAS, no pizzas',
    'Pizza de burrata = Pizza Prosciutto & Burrata'
  ],
  setup_completed = true,
  setup_step = 7,
  selected_plan = 'alicia'
WHERE restaurant_id IS NOT NULL;
