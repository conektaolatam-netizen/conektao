-- Create table for restaurant invitations
CREATE TABLE public.restaurant_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee'::user_role,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.restaurant_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can view invitations in their restaurant" 
ON public.restaurant_invitations 
FOR SELECT 
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can create invitations" 
ON public.restaurant_invitations 
FOR INSERT 
WITH CHECK (
  invited_by = auth.uid() AND
  restaurant_id IN (
    SELECT restaurant_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can accept their own invitations" 
ON public.restaurant_invitations 
FOR UPDATE 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create function to cleanup expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.restaurant_invitations 
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$;