-- Create RLS policies for owners to delete sales and sale items
CREATE POLICY "Owners can delete sales in their restaurant" 
ON public.sales 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'owner'
    AND p.restaurant_id = (
      SELECT pr.restaurant_id 
      FROM profiles pr 
      WHERE pr.id = sales.user_id
    )
  )
);

CREATE POLICY "Owners can delete sale items in their restaurant" 
ON public.sale_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM (sales s JOIN profiles p ON s.user_id = p.id)
    WHERE s.id = sale_items.sale_id 
    AND auth.uid() IN (
      SELECT pr.id 
      FROM profiles pr 
      WHERE pr.restaurant_id = p.restaurant_id 
      AND pr.role = 'owner'
    )
  )
);