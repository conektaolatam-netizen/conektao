-- Add face recognition columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS face_descriptor float8[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS face_photo_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS face_enrolled_at timestamptz DEFAULT NULL;

-- Add face verification columns to time_clock_records
ALTER TABLE public.time_clock_records 
ADD COLUMN IF NOT EXISTS face_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS face_confidence numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS face_photo_url text DEFAULT NULL;

-- Create storage bucket for face photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-photos', 'face-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for face-photos bucket
CREATE POLICY "Users can upload their own face photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'face-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can upload face photos for employees"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'face-photos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view face photos in their restaurant"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'face-photos' AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
    AND p2.id::text = (storage.foldername(name))[1]
    AND p1.restaurant_id = p2.restaurant_id
  )
);

CREATE POLICY "Admins can delete face photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'face-photos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);