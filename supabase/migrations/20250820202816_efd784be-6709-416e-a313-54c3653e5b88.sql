-- Allow initial owner to create their own profile for an owned restaurant
CREATE POLICY IF NOT EXISTS "Owner can create own profile for owned restaurant" 
ON public.profiles
FOR INSERT
WITH CHECK (
  id = auth.uid()
  AND role = 'owner'
  AND restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- Optional: allow creators to insert profiles they create for same restaurant when they are owner/admin
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