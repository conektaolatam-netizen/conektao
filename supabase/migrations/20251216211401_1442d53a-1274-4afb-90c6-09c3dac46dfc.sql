-- Tabla para sesiones de importación de menú
CREATE TABLE public.menu_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'review', 'confirmed', 'cancelled', 'error')),
  original_images TEXT[] DEFAULT '{}',
  extracted_data JSONB DEFAULT '{}',
  final_data JSONB DEFAULT '{}',
  products_created INTEGER DEFAULT 0,
  categories_created INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.menu_import_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import sessions"
ON public.menu_import_sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Storage bucket para imágenes de menú
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-imports', 'menu-imports', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage
CREATE POLICY "Users can upload menu images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'menu-imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Menu images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-imports');