-- Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Crear bucket para imágenes de tiendas
INSERT INTO storage.buckets (id, name, public) VALUES ('store-images', 'store-images', true);

-- Políticas para product-images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Suppliers can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Suppliers can update their product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Suppliers can delete their product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Políticas para store-images
CREATE POLICY "Store images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'store-images');

CREATE POLICY "Suppliers can upload store images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Suppliers can update their store images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Suppliers can delete their store images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);