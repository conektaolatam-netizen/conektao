-- Create storage bucket for transfer payment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-photos', 'transfer-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for transfer photos
CREATE POLICY "Users can upload transfer photos for their restaurant"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'transfer-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.restaurant_id IS NOT NULL
  )
);

CREATE POLICY "Users can view transfer photos in their restaurant"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'transfer-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
    AND p2.id = (storage.foldername(name))[1]::uuid
    AND p1.restaurant_id = p2.restaurant_id
  )
);

CREATE POLICY "Users can update transfer photos they uploaded"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'transfer-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete transfer photos they uploaded"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'transfer-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);