-- Update cash_payments table to handle positive and negative amounts
ALTER TABLE public.cash_payments 
ALTER COLUMN amount TYPE NUMERIC;

-- Update the policies to be more flexible
DROP POLICY IF EXISTS "Users can create cash payments" ON public.cash_payments;

CREATE POLICY "Users can create cash payments" 
ON public.cash_payments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cash_registers cr
    JOIN profiles p ON cr.restaurant_id = p.restaurant_id
    WHERE cr.id = cash_register_id
    AND p.id = auth.uid()
    AND NOT cr.is_closed
  )
);