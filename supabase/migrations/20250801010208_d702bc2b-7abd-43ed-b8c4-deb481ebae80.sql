-- Verificar y crear tablas necesarias para el sistema de facturación

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  sku TEXT UNIQUE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de inventario
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- 4. Crear tabla de ventas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  table_number INTEGER,
  customer_email TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla de items de venta
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  movement_type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'SALE', 'PURCHASE', 'ADJUSTMENT'
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora para desarrollo)
CREATE POLICY IF NOT EXISTS "Allow all operations on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on sale_items" ON public.sale_items FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on inventory_movements" ON public.inventory_movements FOR ALL USING (true);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar inventario automáticamente cuando se hace una venta
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Reducir stock cuando se crea un item de venta
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    -- Crear movimiento de inventario
    INSERT INTO public.inventory_movements (
      product_id, 
      movement_type, 
      quantity, 
      reference_type, 
      reference_id,
      notes
    ) VALUES (
      NEW.product_id, 
      'OUT', 
      NEW.quantity, 
      'SALE', 
      NEW.sale_id,
      'Venta automática'
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar inventario automáticamente
DROP TRIGGER IF EXISTS trigger_update_inventory_on_sale ON public.sale_items;
CREATE TRIGGER trigger_update_inventory_on_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION update_inventory_on_sale();

-- Insertar datos de ejemplo
INSERT INTO public.categories (name, description) VALUES 
  ('Pizzas', 'Pizzas artesanales'),
  ('Bebidas', 'Bebidas frías y calientes'),
  ('Postres', 'Postres caseros'),
  ('Entradas', 'Entradas y aperitivos')
ON CONFLICT (name) DO NOTHING;

-- Obtener IDs de categorías
DO $$
DECLARE
  pizza_cat_id UUID;
  bebida_cat_id UUID;
  postre_cat_id UUID;
  entrada_cat_id UUID;
BEGIN
  SELECT id INTO pizza_cat_id FROM public.categories WHERE name = 'Pizzas';
  SELECT id INTO bebida_cat_id FROM public.categories WHERE name = 'Bebidas';
  SELECT id INTO postre_cat_id FROM public.categories WHERE name = 'Postres';
  SELECT id INTO entrada_cat_id FROM public.categories WHERE name = 'Entradas';

  -- Insertar productos de ejemplo
  INSERT INTO public.products (name, description, price, category_id, sku) VALUES 
    ('Pizza Margherita', 'Pizza con tomate, mozzarella y albahaca', 25000, pizza_cat_id, 'PIZZA001'),
    ('Pizza Pepperoni', 'Pizza con pepperoni y queso', 28000, pizza_cat_id, 'PIZZA002'),
    ('Coca Cola', 'Bebida refrescante 350ml', 4500, bebida_cat_id, 'BEB001'),
    ('Agua', 'Agua natural 500ml', 2500, bebida_cat_id, 'BEB002'),
    ('Tiramisu', 'Postre italiano tradicional', 12000, postre_cat_id, 'POST001'),
    ('Pan de Ajo', 'Entrada de pan con ajo', 8000, entrada_cat_id, 'ENT001')
  ON CONFLICT (sku) DO NOTHING;

  -- Insertar inventario inicial
  INSERT INTO public.inventory (product_id, current_stock, min_stock)
  SELECT p.id, 50, 10
  FROM public.products p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory i WHERE i.product_id = p.id
  );
END $$;