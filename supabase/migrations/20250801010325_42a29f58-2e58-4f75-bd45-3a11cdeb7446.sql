-- Insertar datos de ejemplo para el sistema de facturación

-- Insertar categorías
INSERT INTO public.categories (name, description) VALUES 
  ('Pizzas', 'Pizzas artesanales'),
  ('Bebidas', 'Bebidas frías y calientes'),
  ('Postres', 'Postres caseros'),
  ('Entradas', 'Entradas y aperitivos')
ON CONFLICT (name) DO NOTHING;

-- Insertar productos de ejemplo
WITH category_ids AS (
  SELECT id as pizza_id FROM public.categories WHERE name = 'Pizzas' LIMIT 1
), bebida_ids AS (
  SELECT id as bebida_id FROM public.categories WHERE name = 'Bebidas' LIMIT 1
), postre_ids AS (
  SELECT id as postre_id FROM public.categories WHERE name = 'Postres' LIMIT 1
), entrada_ids AS (
  SELECT id as entrada_id FROM public.categories WHERE name = 'Entradas' LIMIT 1
)
INSERT INTO public.products (name, description, price, category_id, sku) 
SELECT * FROM (VALUES 
  ('Pizza Margherita', 'Pizza con tomate, mozzarella y albahaca', 25000.00, (SELECT pizza_id FROM category_ids), 'PIZZA001'),
  ('Pizza Pepperoni', 'Pizza con pepperoni y queso', 28000.00, (SELECT pizza_id FROM category_ids), 'PIZZA002'),
  ('Pizza Hawaiana', 'Pizza con jamón y piña', 30000.00, (SELECT pizza_id FROM category_ids), 'PIZZA003'),
  ('Coca Cola', 'Bebida refrescante 350ml', 4500.00, (SELECT bebida_id FROM bebida_ids), 'BEB001'),
  ('Agua', 'Agua natural 500ml', 2500.00, (SELECT bebida_id FROM bebida_ids), 'BEB002'),
  ('Cerveza', 'Cerveza nacional 330ml', 6000.00, (SELECT bebida_id FROM bebida_ids), 'BEB003'),
  ('Tiramisu', 'Postre italiano tradicional', 12000.00, (SELECT postre_id FROM postre_ids), 'POST001'),
  ('Brownie', 'Brownie de chocolate con helado', 10000.00, (SELECT postre_id FROM postre_ids), 'POST002'),
  ('Pan de Ajo', 'Entrada de pan con ajo', 8000.00, (SELECT entrada_id FROM entrada_ids), 'ENT001'),
  ('Alitas BBQ', 'Alitas de pollo en salsa BBQ', 15000.00, (SELECT entrada_id FROM entrada_ids), 'ENT002')
) AS v(name, description, price, category_id, sku)
ON CONFLICT (sku) DO NOTHING;

-- Insertar inventario inicial para todos los productos
INSERT INTO public.inventory (product_id, current_stock, min_stock, max_stock)
SELECT p.id, 50, 10, 100
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory i WHERE i.product_id = p.id
);