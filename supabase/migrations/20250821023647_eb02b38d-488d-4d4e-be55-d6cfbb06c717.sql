-- Limpiar usuarios huérfanos que no tienen establecimiento asignado
-- Estos usuarios se registraron pero no completaron el setup
DELETE FROM profiles WHERE restaurant_id IS NULL AND role = 'employee';

-- Verificar que los datos estén bien separados por establecimiento
-- Limpiar cualquier producto, venta o inventario que no tenga dueño correctamente asignado
DELETE FROM sale_items WHERE sale_id IN (
  SELECT s.id FROM sales s 
  LEFT JOIN profiles p ON s.user_id = p.id 
  WHERE p.restaurant_id IS NULL
);

DELETE FROM sales WHERE user_id IN (
  SELECT p.id FROM profiles p WHERE p.restaurant_id IS NULL
);

DELETE FROM inventory_movements WHERE product_id IN (
  SELECT pr.id FROM products pr 
  LEFT JOIN profiles p ON pr.user_id = p.id 
  WHERE p.restaurant_id IS NULL
);

DELETE FROM inventory WHERE user_id IN (
  SELECT p.id FROM profiles p WHERE p.restaurant_id IS NULL
);

DELETE FROM products WHERE user_id IN (
  SELECT p.id FROM profiles p WHERE p.restaurant_id IS NULL
);

DELETE FROM expenses WHERE user_id IN (
  SELECT p.id FROM profiles p WHERE p.restaurant_id IS NULL
);

DELETE FROM expense_items WHERE expense_id IN (
  SELECT e.id FROM expenses e 
  LEFT JOIN profiles p ON e.user_id = p.id 
  WHERE p.restaurant_id IS NULL
);

DELETE FROM categories WHERE user_id IN (
  SELECT p.id FROM profiles p WHERE p.restaurant_id IS NULL
);