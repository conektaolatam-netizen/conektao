-- Reset de datos para el restaurante asociado a 'morethanacai@gmail.com'
WITH target_restaurant AS (
  SELECT restaurant_id FROM public.profiles 
  WHERE email = 'morethanacai@gmail.com' AND restaurant_id IS NOT NULL 
  LIMIT 1
),
users_in_restaurant AS (
  SELECT id FROM public.profiles 
  WHERE restaurant_id = (SELECT restaurant_id FROM target_restaurant)
),
sales_to_delete AS (
  SELECT s.id FROM public.sales s 
  WHERE s.user_id IN (SELECT id FROM users_in_restaurant)
),
sale_items_to_delete AS (
  SELECT si.id FROM public.sale_items si 
  WHERE si.sale_id IN (SELECT id FROM sales_to_delete)
),
expenses_to_delete AS (
  SELECT e.id FROM public.expenses e 
  WHERE e.user_id IN (SELECT id FROM users_in_restaurant)
),
registers_in_restaurant AS (
  SELECT cr.id FROM public.cash_registers cr 
  WHERE cr.restaurant_id = (SELECT restaurant_id FROM target_restaurant)
)
-- 1) Eliminar toppings de los items de venta
DELETE FROM public.sale_item_toppings 
WHERE sale_item_id IN (SELECT id FROM sale_items_to_delete);

-- 2) Eliminar items de venta
DELETE FROM public.sale_items 
WHERE id IN (SELECT id FROM sale_items_to_delete);

-- 3) Eliminar movimientos de inventario asociados a ventas de este restaurante (por referencia de venta)
DELETE FROM public.inventory_movements im
WHERE reference_type = 'SALE' AND reference_id IN (SELECT id FROM sales_to_delete);

-- 4) Eliminar ventas
DELETE FROM public.sales 
WHERE id IN (SELECT id FROM sales_to_delete);

-- 5) Eliminar items de gastos y gastos
DELETE FROM public.expense_items 
WHERE expense_id IN (SELECT id FROM expenses_to_delete);

DELETE FROM public.expenses 
WHERE id IN (SELECT id FROM expenses_to_delete);

-- 6) Eliminar pagos en efectivo de cajas del restaurante
DELETE FROM public.cash_payments 
WHERE cash_register_id IN (SELECT id FROM registers_in_restaurant);

-- 7) Poner en 0 las cajas del restaurante
UPDATE public.cash_registers 
SET opening_balance = 0,
    current_cash = 0,
    final_cash = 0,
    cash_difference = 0,
    is_closed = false,
    closed_at = NULL,
    closed_by = NULL,
    notes = NULL,
    updated_at = now()
WHERE id IN (SELECT id FROM registers_in_restaurant);
