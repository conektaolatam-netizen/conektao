
CREATE TABLE public.pos_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  restaurant_name TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own waitlist entry"
  ON public.pos_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own waitlist entry"
  ON public.pos_waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Prevent duplicates per user
CREATE UNIQUE INDEX idx_pos_waitlist_user ON public.pos_waitlist(user_id);
