-- Tabla para capturar datos parciales de usuarios que abandonan el formulario
CREATE TABLE public.prelaunch_partial_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  step_reached INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  business_type TEXT,
  phone TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  is_converted BOOLEAN DEFAULT false
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_partial_registrations_session ON public.prelaunch_partial_registrations(session_id);
CREATE INDEX idx_partial_registrations_created ON public.prelaunch_partial_registrations(created_at DESC);
CREATE INDEX idx_partial_registrations_converted ON public.prelaunch_partial_registrations(is_converted);

-- RLS - permitir inserts anónimos para el formulario público
ALTER TABLE public.prelaunch_partial_registrations ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserts anónimos (formulario público)
CREATE POLICY "Allow anonymous inserts for partial registrations" 
ON public.prelaunch_partial_registrations 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir updates anónimos (para actualizar el mismo session_id)
CREATE POLICY "Allow anonymous updates for partial registrations" 
ON public.prelaunch_partial_registrations 
FOR UPDATE 
USING (true);

-- Política para permitir lectura solo a usuarios autenticados (admin)
CREATE POLICY "Allow authenticated users to read partial registrations" 
ON public.prelaunch_partial_registrations 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Trigger para actualizar updated_at
CREATE TRIGGER update_partial_registrations_updated_at
BEFORE UPDATE ON public.prelaunch_partial_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();