-- Create prelaunch_registrations table for Conektao pre-launch signups
CREATE TABLE public.prelaunch_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  branches TEXT NOT NULL,
  main_business_type TEXT NOT NULL,
  pos_uses BOOLEAN NOT NULL DEFAULT false,
  pos_name TEXT,
  improvements_wanted TEXT[] NOT NULL DEFAULT '{}',
  free_trial_interest TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prelaunch_registrations ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous inserts (for the public form)
CREATE POLICY "Allow anonymous inserts" 
ON public.prelaunch_registrations 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow admins to view all registrations
CREATE POLICY "Admins can view all registrations" 
ON public.prelaunch_registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  )
);