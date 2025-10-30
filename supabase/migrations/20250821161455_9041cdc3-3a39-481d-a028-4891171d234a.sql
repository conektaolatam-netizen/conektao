-- Security Fix: Implement customer email masking for sales records

-- 1. Create function to check if user can see customer emails
CREATE OR REPLACE FUNCTION public.can_see_customer_emails()
RETURNS boolean
LANGUAGE sql
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

-- 2. Create function to mask customer emails
CREATE OR REPLACE FUNCTION public.mask_customer_email(email text)
RETURNS text
LANGUAGE sql
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

-- 3. Create secure view for sales with masked emails
CREATE OR REPLACE VIEW public.sales_with_masked_emails AS
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

-- 4. Grant access to the view
GRANT SELECT ON public.sales_with_masked_emails TO authenticated;

-- 5. Update sales table RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can access sales in their restaurant with masked emails" ON public.sales;
DROP POLICY IF EXISTS "Users can only see their own sales" ON public.sales;

-- New restrictive policies for sales table
CREATE POLICY "Users can create their own sales" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sales" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can see all sales in restaurant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND restaurant_id = (
      SELECT restaurant_id 
      FROM public.profiles 
      WHERE id = sales.user_id
    )
  )
);

CREATE POLICY "Users can see their own sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());