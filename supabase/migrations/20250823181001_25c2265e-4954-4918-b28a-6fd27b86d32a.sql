-- Add geolocation fields to profiles table for employee location tracking
ALTER TABLE public.profiles 
ADD COLUMN work_latitude NUMERIC,
ADD COLUMN work_longitude NUMERIC,
ADD COLUMN work_address TEXT,
ADD COLUMN location_radius INTEGER DEFAULT 100;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.profiles.work_latitude IS 'Latitude coordinate for employee work location';
COMMENT ON COLUMN public.profiles.work_longitude IS 'Longitude coordinate for employee work location';
COMMENT ON COLUMN public.profiles.work_address IS 'Human readable work address for employee';
COMMENT ON COLUMN public.profiles.location_radius IS 'Allowed radius in meters from work location for clock in/out';