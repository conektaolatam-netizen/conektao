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

-- Create a secure view for sales that masks customer emails
CREATE OR REPLACE VIEW public.sales_secure AS
SELECT 
  id,
  total_amount,
  table_number,
  created_at,
  updated_at,
  user_id,
  payment_method,
  public.mask_customer_email(customer_email) as customer_email,
  status
FROM public.sales;

-- Enable RLS on the secure view
ALTER VIEW public.sales_secure SET (security_barrier = true);

-- Grant access to the secure view
GRANT SELECT ON public.sales_secure TO authenticated;

-- Create RLS policy for the secure view
CREATE POLICY "Users can access secure sales in their restaurant"
ON public.sales_secure
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT profiles.restaurant_id 
      FROM public.profiles 
      WHERE profiles.id = sales_secure.user_id
    )
  )
  OR user_id = auth.uid()
);

-- Update the existing sales table policies to be more restrictive for direct access
DROP POLICY IF EXISTS "Users can only access sales in their restaurant" ON public.sales;

-- Only allow owners/admins to access the raw sales table directly
CREATE POLICY "Only owners and admins can access raw sales data"
ON public.sales
FOR SELECT
USING (
  public.can_see_customer_emails() 
  AND (
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
  )
);