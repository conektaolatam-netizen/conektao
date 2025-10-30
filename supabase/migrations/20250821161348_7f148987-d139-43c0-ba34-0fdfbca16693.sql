-- Create a view that masks customer emails for non-privileged users
CREATE OR REPLACE VIEW public.sales_with_masked_emails AS
SELECT 
  id,
  total_amount,
  table_number,
  created_at,
  updated_at,
  user_id,
  payment_method,
  status,
  -- Use the existing mask_customer_email function
  public.mask_customer_email(customer_email) as customer_email
FROM public.sales;

-- Enable RLS on the view
ALTER VIEW public.sales_with_masked_emails SET (security_invoker = on);

-- Update the sales table RLS policies to be more restrictive for customer_email access
DROP POLICY IF EXISTS "Users can access sales in their restaurant with masked emails" ON public.sales;
DROP POLICY IF EXISTS "Users can only see their own sales" ON public.sales;

-- Create new policies with better email protection
CREATE POLICY "Users can create their own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sales" 
ON public.sales 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view sales in their restaurant" 
ON public.sales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.restaurant_id = (
      SELECT profiles_1.restaurant_id 
      FROM profiles profiles_1 
      WHERE profiles_1.id = sales.user_id
    )
  ) 
  OR user_id = auth.uid()
);

-- Grant access to the masked view for authenticated users
GRANT SELECT ON public.sales_with_masked_emails TO authenticated;