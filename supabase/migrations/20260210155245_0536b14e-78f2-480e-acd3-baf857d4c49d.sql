
-- 1. whatsapp_configs
CREATE TABLE public.whatsapp_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  whatsapp_phone_number_id TEXT NOT NULL,
  whatsapp_access_token TEXT,
  verify_token TEXT NOT NULL DEFAULT 'conektao_2026',
  order_email TEXT NOT NULL,
  delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  delivery_company_email TEXT,
  promoted_products TEXT[] DEFAULT '{}',
  greeting_message TEXT DEFAULT 'Hola! 👋 Bienvenido a nuestro restaurante. Soy ALICIA, tu asistente virtual. ¿En qué puedo ayudarte hoy?',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(whatsapp_phone_number_id)
);
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their whatsapp config"
  ON public.whatsapp_configs FOR ALL
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "Service role full access on whatsapp_configs"
  ON public.whatsapp_configs FOR ALL USING (true) WITH CHECK (true);

-- 2. whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_order JSONB DEFAULT NULL,
  order_status TEXT NOT NULL DEFAULT 'none' CHECK (order_status IN ('none','building','confirmed','sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, customer_phone)
);
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "Service role full access on whatsapp_conversations"
  ON public.whatsapp_conversations FOR ALL USING (true) WITH CHECK (true);

-- 3. whatsapp_orders
CREATE TABLE public.whatsapp_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('pickup','delivery')),
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','preparing','ready','delivered','cancelled')),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their orders"
  ON public.whatsapp_orders FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "Service role full access on whatsapp_orders"
  ON public.whatsapp_orders FOR ALL USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_whatsapp_configs_updated_at
  BEFORE UPDATE ON public.whatsapp_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
