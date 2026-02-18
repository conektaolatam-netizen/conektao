
-- Paso 1: Agregar columna is_recommended a products si no existe
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT false;

-- Paso 2: Asegurar que las categorías necesarias existen con los nombres correctos
-- Ya existen: Bebidas frías, Buon Appetito, Cervezas, Cócteles, Limonadas, 
-- Pizzas - Mediana, Pizzas - Personal, Sandwiches, Sodificadas, Tapas Españolas, Vinos, Vinos Botella
-- Necesitamos verificar/crear: Entradas, Cocina Italiana, Pizzas Dulces

-- Cocina Italiana existe como "Cocina Italiana" (c632ef75)
-- Entradas existe como "Entradas" (dccd5abb)
-- Pizzas Dulces existe como "Pizzas Dulces" (f49b2abb)

-- Solo necesitamos asegurarnos que están ahí (ya existen según la consulta)
SELECT 1; -- placeholder, las categorías ya existen
