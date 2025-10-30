-- Reset completo de datos para el restaurante de 'morethanacai@gmail.com'

-- 1) Eliminar toppings de sale_items del restaurante
DELETE FROM public.sale_item_toppings 
WHERE sale_item_id IN (
  SELECT si.id 
  FROM public.sale_items si 
  JOIN public.sales s ON si.sale_id = s.id
  JOIN public.profiles p ON s.user_id = p.id
  WHERE p.restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 2) Eliminar sale_items del restaurante
DELETE FROM public.sale_items 
WHERE sale_id IN (
  SELECT s.id 
  FROM public.sales s 
  JOIN public.profiles p ON s.user_id = p.id
  WHERE p.restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 3) Eliminar movimientos de inventario por ventas del restaurante
DELETE FROM public.inventory_movements 
WHERE reference_type = 'SALE' 
AND reference_id IN (
  SELECT s.id 
  FROM public.sales s 
  JOIN public.profiles p ON s.user_id = p.id
  WHERE p.restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 4) Eliminar ventas del restaurante
DELETE FROM public.sales 
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 5) Eliminar expense_items del restaurante
DELETE FROM public.expense_items 
WHERE expense_id IN (
  SELECT e.id 
  FROM public.expenses e 
  JOIN public.profiles p ON e.user_id = p.id
  WHERE p.restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 6) Eliminar expenses del restaurante
DELETE FROM public.expenses 
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 7) Eliminar pagos en efectivo del restaurante
DELETE FROM public.cash_payments 
WHERE cash_register_id IN (
  SELECT id FROM public.cash_registers 
  WHERE restaurant_id = (
    SELECT restaurant_id FROM public.profiles 
    WHERE email = 'morethanacai@gmail.com' LIMIT 1
  )
);

-- 8) Resetear cajas del restaurante
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
WHERE restaurant_id = (
  SELECT restaurant_id FROM public.profiles 
  WHERE email = 'morethanacai@gmail.com' LIMIT 1
);