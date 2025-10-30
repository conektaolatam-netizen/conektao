-- Crear tabla para documentos del sistema
CREATE TABLE public.business_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'invoice', 'daily_summary', 'expense_report', 'sales_analysis'
  document_date DATE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Contenido del documento
  ai_analysis JSONB, -- Análisis de IA
  metadata JSONB DEFAULT '{}', -- Metadatos adicionales
  file_url TEXT, -- URL del archivo si aplica
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can access documents in their restaurant" 
ON public.business_documents 
FOR ALL 
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create documents for their restaurant" 
ON public.business_documents 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Crear índices para mejor performance
CREATE INDEX idx_business_documents_restaurant_date ON public.business_documents(restaurant_id, document_date DESC);
CREATE INDEX idx_business_documents_type ON public.business_documents(document_type);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_business_documents_updated_at
BEFORE UPDATE ON public.business_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();