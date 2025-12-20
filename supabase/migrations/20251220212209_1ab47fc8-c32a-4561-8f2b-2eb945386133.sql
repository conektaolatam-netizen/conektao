-- Crear categorías faltantes
INSERT INTO categories (name, user_id, description) VALUES
('Entradas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Entradas y aperitivos'),
('Cocina Italiana', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Pastas italianas'),
('Pizzas Dulces', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Postres en pizza')
ON CONFLICT DO NOTHING;

-- Insertar TODOS los productos para labarracreatupizzacierre@gmail.com
-- Los precios están en miles de COP (ej: 9 = $9,000 COP)

INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
-- LIMONADAS
('Limonada Natural', 9000, 'Jugo de limón fresco con agua y endulzante', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', true),
('Limonada Hierbabuena', 11000, 'Limonada con hierbabuena fresca', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', true),
('Limonada Cerezada', 12000, 'Base limonada natural con jarabe de cereza', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', true),
('Limonada Coco', 14000, 'Limonada con leche de coco', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9ca3aa67-b0b2-4a5f-9efb-0f230b1a9765', true),

-- SODIFICADAS
('Sodificada Piña', 12000, 'Pulpa de piña con agua con gas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '382c0d32-e05a-45c2-baf3-2b00dcc270a3', true),
('Sodificada Frutos Rojos', 12000, 'Pulpa de frutos rojos con soda', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '382c0d32-e05a-45c2-baf3-2b00dcc270a3', true),
('Sodificada Lyche & Fresa', 14000, 'Pulpa de lychee y fresa con soda', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '382c0d32-e05a-45c2-baf3-2b00dcc270a3', true),

-- CÓCTELES
('Gintonic', 39000, 'Ginebra con tónica y garnish', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '56a53c14-0bd1-471c-8130-bb072fdb7370', true),
('Mojito', 36000, 'Ron blanco, limón, hierbabuena y soda', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '56a53c14-0bd1-471c-8130-bb072fdb7370', true),
('Margarita', 34000, 'Tequila, triple sec y jugo de limón', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '56a53c14-0bd1-471c-8130-bb072fdb7370', true),
('Piña Colada', 32000, 'Ron blanco, crema de coco y jugo de piña', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '56a53c14-0bd1-471c-8130-bb072fdb7370', true),
('Aperol Spritz', 25000, 'Aperol, prosecco y soda con rodaja de naranja', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '56a53c14-0bd1-471c-8130-bb072fdb7370', true),

-- VINOS Y SANGRÍA
('Sangría Tinto Copa', 24000, 'Vino tinto con frutas frescas - Copa', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Sangría Tinto 500ml', 53000, 'Vino tinto con frutas frescas - 500ml', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Sangría Tinto 1L', 82000, 'Vino tinto con frutas frescas - 1 Litro', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Sangría Blanco Copa', 26000, 'Vino blanco con frutas frescas - Copa', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Sangría Blanco 500ml', 56000, 'Vino blanco con frutas frescas - 500ml', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Sangría Blanco 1L', 88000, 'Vino blanco con frutas frescas - 1 Litro', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Copa de Vino', 24000, 'Vino tipo casa', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),
('Tinto de Verano', 22000, 'Vino tinto con gaseosa y limón', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'ef803bde-cd8a-45e2-bb1b-76a4b162e1a7', true),

-- CERVEZAS
('Club Colombia', 12000, 'Cerveza Club Colombia', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9462ac98-38b1-4485-a456-8f1424a6ae82', true),
('Corona', 14000, 'Cerveza Corona con rodaja de limón', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9462ac98-38b1-4485-a456-8f1424a6ae82', true),
('Stella Artois', 15000, 'Cerveza Stella Artois', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9462ac98-38b1-4485-a456-8f1424a6ae82', true),
('Cerveza Artesanal', 15000, 'Cerveza artesanal', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9462ac98-38b1-4485-a456-8f1424a6ae82', true),

-- BEBIDAS FRÍAS
('Gaseosa', 7000, 'Gaseosa variedad', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9c12e418-e545-4646-b4f3-9f1e3cfcb545', true),
('Agua mineral', 6000, 'Agua mineral natural', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9c12e418-e545-4646-b4f3-9f1e3cfcb545', true),
('Agua con gas', 6000, 'Agua con gas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9c12e418-e545-4646-b4f3-9f1e3cfcb545', true),
('Agua St. Pellegrino 1L', 19000, 'Agua mineral premium St. Pellegrino 1L', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', '9c12e418-e545-4646-b4f3-9f1e3cfcb545', true);