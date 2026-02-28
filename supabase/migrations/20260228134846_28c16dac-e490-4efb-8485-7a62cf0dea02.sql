
CREATE TABLE public.vendedores_mensajes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_whatsapp TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendedores_mensajes_whatsapp ON public.vendedores_mensajes (vendedor_whatsapp, created_at DESC);

-- No RLS needed — only accessed via service role from edge functions
