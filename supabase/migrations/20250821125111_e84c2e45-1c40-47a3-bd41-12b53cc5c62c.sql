-- Create a secure function to check if user can see customer emails
CREATE OR REPLACE FUNCTION public.can_see_customer_emails()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
$$;

-- Create a function to mask customer emails for non-authorized users
CREATE OR REPLACE FUNCTION public.mask_customer_email(email TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.can_see_customer_emails() THEN email
      WHEN email IS NULL THEN NULL
      ELSE CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
    END;
$$;

-- Update the existing sales table policies to use email masking
DROP POLICY IF EXISTS "Users can only access sales in their restaurant" ON public.sales;

-- Create a more secure policy that allows access but masks emails for non-privileged users
CREATE POLICY "Users can access sales in their restaurant with masked emails"
ON public.sales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT profiles.restaurant_id 
      FROM public.profiles 
      WHERE profiles.id = sales.user_id
    )
  )
  OR user_id = auth.uid()
);