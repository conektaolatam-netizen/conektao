
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to register (public-facing page, no auth required)
CREATE POLICY "Anyone can register as vendedor"
  ON public.vendedores FOR INSERT
  WITH CHECK (true);

-- Only service role can read vendedores data
CREATE POLICY "Service role can read vendedores"
  ON public.vendedores FOR SELECT
  USING (false);
