-- Crear categorías para el usuario labarracreatupizzacierre@gmail.com
INSERT INTO categories (name, user_id, description) VALUES
('Limonadas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Bebidas refrescantes de limón'),
('Sodificadas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Bebidas con soda'),
('Cócteles', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Cócteles clásicos'),
('Vinos', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Vinos y sangría'),
('Cervezas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Cervezas nacionales e importadas'),
('Bebidas frías', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Aguas y gaseosas'),
('Entradas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Entradas y aperitivos'),
('Pizzas - Personal', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Pizzas tamaño personal'),
('Pizzas - Mediana', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Pizzas tamaño mediana'),
('Tapas Españolas', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Tapas españolas tradicionales'),
('Cocina Italiana', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Pastas y platos italianos'),
('Buon Appetito', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Hamburguesas y carnes'),
('Sandwiches', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Sandwiches y brioche'),
('Vinos Botella', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Vinos por botella'),
('Pizzas Dulces', 'ec74ccc5-8888-480a-bf16-3891cb10d74d', 'Postres en pizza')
ON CONFLICT DO NOTHING;