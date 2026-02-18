
-- ============================================================
-- SINCRONIZACIÓN COMPLETA CATÁLOGO LA BARRA
-- Owner user_id: ec74ccc5-8888-480a-bf16-3891cb10d74d
-- Restaurant ID: 899cb7a7-7de1-47c7-a684-f24658309755
-- ============================================================

-- PASO 1: Desactivar TODOS los productos actuales de La Barra
UPDATE products 
SET is_active = false 
WHERE user_id = 'ec74ccc5-8888-480a-bf16-3891cb10d74d';

-- ============================================================
-- PASO 2: UPSERT de todos los productos oficiales
-- Usamos ON CONFLICT por nombre+category_id para evitar duplicados
-- ============================================================

-- ---- LIMONADAS (category: 9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Limonada Natural', '', 9000, '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Limonada Hierbabuena', '', 12000, '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Limonada Cerezada', '', 14000, '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Limonada Coco', '', 16000, '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true)
ON CONFLICT DO NOTHING;

-- ---- SODIFICADAS (category: 382c0d32-e05a-45c2-baf3-2b00dcc270a3) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Sodificada Piña', '', 14000, '382c0d32-e05a-45c2-baf3-2b00dcc270a3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Sodificada Frutos Rojos', '', 14000, '382c0d32-e05a-45c2-baf3-2b00dcc270a3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Sodificada Lyche & Fresa', '', 16000, '382c0d32-e05a-45c2-baf3-2b00dcc270a3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- CÓCTELES (category: 56a53c14-0bd1-471c-8130-bb072fdb7370) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Gintonic', '', 42000, '56a53c14-0bd1-471c-8130-bb072fdb7370', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Mojito', '', 40000, '56a53c14-0bd1-471c-8130-bb072fdb7370', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Margarita', '', 38000, '56a53c14-0bd1-471c-8130-bb072fdb7370', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Piña Colada', '', 38000, '56a53c14-0bd1-471c-8130-bb072fdb7370', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Aperol Spritz', '', 28000, '56a53c14-0bd1-471c-8130-bb072fdb7370', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- VINOS (category: ef803bde-cd8a-45e2-bb1b-76a4b162e1a7) ----
-- Sangrías con 3 tamaños: Copa / Jarra / Jarra Grande
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Sangría Tinto Copa', '', 26000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Sangría Tinto Jarra', '', 57000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Sangría Tinto Jarra Grande', '', 86000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Sangría Blanco Copa', '', 28000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Sangría Blanco Jarra', '', 60000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Sangría Blanco Jarra Grande', '', 92000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Copa De Vino', '', 26000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Tinto De Verano', '', 25000, 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- CERVEZAS (category: 9462ac98-38b1-4485-a456-8f1424a6ae82) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Club Colombia', '', 12000, '9462ac98-38b1-4485-a456-8f1424a6ae82', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Corona', '', 16000, '9462ac98-38b1-4485-a456-8f1424a6ae82', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Stella Artois', '', 16000, '9462ac98-38b1-4485-a456-8f1424a6ae82', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Artesanal', '', 16000, '9462ac98-38b1-4485-a456-8f1424a6ae82', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- BEBIDAS FRÍAS (category: 9c12e418-e545-4646-b4f3-9f1e3cfcb545) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Gaseosa', '', 8000, '9c12e418-e545-4646-b4f3-9f1e3cfcb545', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Agua mineral', '', 6000, '9c12e418-e545-4646-b4f3-9f1e3cfcb545', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Agua con gas', '', 6000, '9c12e418-e545-4646-b4f3-9f1e3cfcb545', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Agua St. Pellegrino 1L', '', 19000, '9c12e418-e545-4646-b4f3-9f1e3cfcb545', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- VINOS BOTELLA (category: d4c5ba8a-4abe-4760-9369-98c830376490) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Reservado', '', 68000, 'd4c5ba8a-4abe-4760-9369-98c830376490', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Frontera', '', 85000, 'd4c5ba8a-4abe-4760-9369-98c830376490', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Gato Negro', '', 90000, 'd4c5ba8a-4abe-4760-9369-98c830376490', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Casillero Del Diablo', '', 150000, 'd4c5ba8a-4abe-4760-9369-98c830376490', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Tío Pepe', '', 240000, 'd4c5ba8a-4abe-4760-9369-98c830376490', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- ENTRADAS (category: dccd5abb-c334-40ef-bcde-2009366ec941) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Nuditos De Ajo', 'Nuditos horneados con mantequilla y ajo', 10000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Camarones a las finas hierbas', 'Camarones en reducción de hierbas con parmesano', 35000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Champiñones Gratinados Queso Azul', 'Champiñones en salsa de queso azul y parmesano', 33000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Burrata La Barra', 'Burrata con manzana caramelizada y pistacho', 38000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Burrata Tempura', 'Burrata tempurizada con jamón serrano', 40000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Brie Al Horno', 'Brie con miel de agave y frutos', 32000, 'dccd5abb-c334-40ef-bcde-2009366ec941', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- PIZZAS - PERSONAL (category: 5598137a-b211-40ad-9a41-2f657b5f0da2) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Crea tu pizza', 'Pizza personalizable con 6 toppings', 32000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Margarita', 'Mozzarella, albahaca y tomate cherry', 21000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Hawaiana', 'Jamón y piña con mozzarella', 24000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pollo & Champiñones', 'Pollo, queso azul y champiñones al ajillo', 27000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pepperoni', 'Mozzarella, pepperoni y parmesano', 32000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Del huerto', 'Vegetales y queso azul con parmesano', 35000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Camarones', 'Salsa Alfredo con camarones', 38000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('La Capricciosa', 'Prosciutto, aceitunas y alcachofas', 35000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Colombiana de la Tata', 'Bondiola y reducción en cerveza', 32000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Alpes', 'Mezcla de cuatro quesos', 33000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('La Turca', 'Dátiles, pistacho y chorizo español', 39000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Porchetta', 'Porchetta ahumada y stracciatella', 39000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('A la española', 'Pecorino y chorizo español', 36000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Siciliana', 'Chorizo, salame y pepperoni', 36000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Dátiles', 'Dátiles, tocineta y queso azul', 38000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('La Barra', 'Prosciutto, manzana caramelizada y miel', 36000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Stracciatella', 'Tomate seco, pepperoni y stracciatella', 39000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Anchoas', 'Salame, pimentón y anchoas', 39000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Valencia', 'Prosciutto, queso azul y dátiles', 39000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Parmesana', 'Pepperoni y parmesano tostado', 36000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Higos & Prosciutto Croccante', 'Higos caramelizados y stracciatella', 38000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Diavola', 'Chorizo español y salame italiano', 38000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Calzone', 'Mozzarella, philadelphia, champiñón y jamón', 32000, '5598137a-b211-40ad-9a41-2f657b5f0da2', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- PIZZAS - MEDIANA (category: 4985c348-69e5-4395-9bd2-d3d5cf228967) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Crea tu pizza', 'Pizza personalizable con 6 toppings', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Margarita', 'Mozzarella, albahaca y tomate cherry', 35000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Hawaiana', 'Jamón y piña con mozzarella', 37000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pollo & Champiñones', 'Pollo, queso azul y champiñones al ajillo', 39000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pepperoni', 'Mozzarella, pepperoni y parmesano', 45000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Del huerto', 'Vegetales y queso azul con parmesano', 48000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Camarones', 'Salsa Alfredo con camarones', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('La Capricciosa', 'Prosciutto, aceitunas y alcachofas', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Colombiana de la Tata', 'Bondiola y reducción en cerveza', 47000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Alpes', 'Mezcla de cuatro quesos', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('La Turca', 'Dátiles, pistacho y chorizo español', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Porchetta', 'Porchetta ahumada y stracciatella', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('A la española', 'Pecorino y chorizo español', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Siciliana', 'Chorizo, salame y pepperoni', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Dátiles', 'Dátiles, tocineta y queso azul', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('La Barra', 'Prosciutto, manzana caramelizada y miel', 49000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Prosciutto & Burrata', 'Prosciutto y burrata con balsámico', 54000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Stracciatella', 'Tomate seco, pepperoni y stracciatella', 54000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Anchoas', 'Salame, pimentón y anchoas', 53000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pulpo', 'Pulpo al ajillo con stracciatella', 54000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Valencia', 'Prosciutto, queso azul y dátiles', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Parmesana', 'Pepperoni y parmesano tostado', 50000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Higos & Prosciutto Croccante', 'Higos caramelizados y stracciatella', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Diavola', 'Chorizo español y salame italiano', 52000, '4985c348-69e5-4395-9bd2-d3d5cf228967', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- TAPAS ESPAÑOLAS (category: 82aa15a0-98e1-424f-a59f-7166d4975c1f) ----
-- 3 variantes confirmadas del listado
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Tapas Chorizo Español & Queso Azul & Dátiles', 'Pan francés con queso crema, chorizo español, queso azul y dátiles', 39000, '82aa15a0-98e1-424f-a59f-7166d4975c1f', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Tapas Prosciutto & Rúgula & Parmesano', 'Pan francés con queso crema, prosciutto, rúgula y parmesano', 39000, '82aa15a0-98e1-424f-a59f-7166d4975c1f', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Tapas Chorizo Español & Bocconcinos & Cherry', 'Pan francés con queso crema, chorizo español, bocconcinos y tomate cherry', 39000, '82aa15a0-98e1-424f-a59f-7166d4975c1f', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- COCINA ITALIANA (category: c632ef75-83d5-4ea2-8e7a-5155ab87ecbe) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Spaghetti Alla Bolognese', 'Pasta fresca con salsa bolognesa', 39000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Fettuccine Carbonara', 'Pasta con guanciale y parmesano', 39000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Fettuccine Con Camarones', 'Pasta Alfredo con camarones', 46000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Spaghetti A Los Cuatro Quesos', 'Pasta con mezcla de quesos', 42000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Spaghetti Al Teléfono', 'Salsa napolitana con mozzarella búfala', 42000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Ravioles Del Chef', 'Mix de ravioles boloñesa y quesos', 48000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Lasagna', 'Lasaña bolognesa o mixta con ricotta', 43000, 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- BUON APPETITO (category: 91b2a4b1-d51b-4ac1-aad1-e33a635976f3) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Hamburguesa Italiana', 'Angus con cheddar y papas', 38000, '91b2a4b1-d51b-4ac1-aad1-e33a635976f3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Brocheta di manzo', 'Res y pollo con papas y caprese', 39000, '91b2a4b1-d51b-4ac1-aad1-e33a635976f3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Langostinos Parrillados', 'Langostinos a la parrilla con nuditos', 52000, '91b2a4b1-d51b-4ac1-aad1-e33a635976f3', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- SANDWICHES (category: 137a1ee8-253e-4520-b3a5-c958c23c31d7) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Brioche al camarón', 'Camarón tempura con queso filadelfia', 42000, '137a1ee8-253e-4520-b3a5-c958c23c31d7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Brioche pollo', 'Pollo con salsa blanca y queso azul', 38000, '137a1ee8-253e-4520-b3a5-c958c23c31d7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Pan Francés & Bondiola De Cerdo', 'Bondiola en cerveza con mozzarella', 38000, '137a1ee8-253e-4520-b3a5-c958c23c31d7', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;

-- ---- PIZZAS DULCES (category: f49b2abb-a1b8-4032-9282-068746cdb052) ----
INSERT INTO products (name, description, price, category_id, user_id, is_active, is_recommended)
VALUES 
  ('Cocada', 'Arequipe, coco caramelizado y helado', 20000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Lemon Crust', 'Crema de limón con galleta', 20000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Hershey''s & Malvaviscos', 'Chocolate y malvaviscos flameados', 32000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Dubai Chocolate', 'Pistacho, knafeh y chocolate blanco', 38000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Canelate', 'Chocolate con canela y helado', 25000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Arándanos & Stracciatella', 'Arándanos caramelizados y stracciatella', 32000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Arequipe', 'Arequipe con helado de vainilla', 20000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Frutos Del Bosque', 'Frutos caramelizados con helado', 22000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Nutella', 'Nutella con helado de vainilla', 24000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false),
  ('Nutella & Fresas', 'Nutella con fresas y queso', 32000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, true),
  ('Arequipe & Stracciatella', 'Arequipe con stracciatella', 32000, 'f49b2abb-a1b8-4032-9282-068746cdb052', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', true, false)
ON CONFLICT DO NOTHING;
