
-- Tabla para números bloqueados de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_blocked_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, phone_number)
);

-- RLS
ALTER TABLE public.whatsapp_blocked_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can manage blocked numbers"
ON public.whatsapp_blocked_numbers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND restaurant_id = whatsapp_blocked_numbers.restaurant_id
    AND role IN ('owner', 'admin')
  )
);

-- Índice para búsqueda rápida en el webhook
CREATE INDEX idx_whatsapp_blocked_numbers_lookup 
ON public.whatsapp_blocked_numbers(restaurant_id, phone_number);
