-- Add owner self-insert policy for profiles (Postgres lacks IF NOT EXISTS for policies)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Owner can create own profile for owned restaurant'
  ) THEN
    CREATE POLICY "Owner can create own profile for owned restaurant" 
    ON public.profiles
    FOR INSERT
    WITH CHECK (
      id = auth.uid()
      AND role = 'owner'
      AND restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Optional: allow creators to insert profiles when owner/admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Owners/Admins can create profiles in their restaurant'
  ) THEN
    CREATE POLICY "Owners/Admins can create profiles in their restaurant"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
      created_by = auth.uid() AND public.can_manage_restaurant(restaurant_id)
    );
  END IF;
END $$;