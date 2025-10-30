-- RESETEO DE VENTAS PARA RESTAURANTE MOCAI
-- Mantener productos, eliminar solo datos de ventas

-- 1. Eliminar items de ventas relacionados con ventas del restaurante MOCAI
DELETE FROM public.sale_item_toppings 
WHERE sale_item_id IN (
  SELECT si.id 
  FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  JOIN profiles p ON s.user_id = p.id
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 2. Eliminar items de ventas
DELETE FROM public.sale_items 
WHERE sale_id IN (
  SELECT s.id 
  FROM sales s
  JOIN profiles p ON s.user_id = p.id
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 3. Eliminar ventas
DELETE FROM public.sales 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 4. Resetear inventario a stock 0 (mantener productos pero resetear stock)
UPDATE public.inventory 
SET current_stock = 0, last_updated = NOW()
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 5. Eliminar movimientos de inventario
DELETE FROM public.inventory_movements 
WHERE product_id IN (
  SELECT pr.id 
  FROM products pr
  JOIN profiles p ON pr.user_id = p.id
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 6. Cerrar y resetear cajas registradoras abiertas
UPDATE public.cash_registers 
SET is_closed = true, 
    final_cash = opening_balance,
    cash_difference = 0,
    closed_at = NOW(),
    notes = 'Reseteo automático por problema técnico'
WHERE restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556' 
AND is_closed = false;

-- 7. Eliminar pagos en efectivo relacionados
DELETE FROM public.cash_payments 
WHERE cash_register_id IN (
  SELECT cr.id 
  FROM cash_registers cr
  WHERE cr.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 8. Eliminar gastos registrados
DELETE FROM public.expense_items 
WHERE expense_id IN (
  SELECT e.id 
  FROM expenses e
  JOIN profiles p ON e.user_id = p.id
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

DELETE FROM public.expenses 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556'
);

-- 9. Eliminar documentos de negocio generados automáticamente
DELETE FROM public.business_documents 
WHERE restaurant_id = '015e35ec-bb82-4522-a40d-f762b0f91556';

-- Nota: Los productos, categorías, proveedores y configuraciones se mantienen intactos