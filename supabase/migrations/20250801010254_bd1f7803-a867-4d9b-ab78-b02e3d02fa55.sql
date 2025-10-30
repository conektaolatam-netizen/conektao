-- Crear tablas necesarias para el sistema de facturación

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
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT,
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

-- Eliminar políticas existentes y crear nuevas
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow all operations on inventory_movements" ON public.inventory_movements;

-- Crear políticas de seguridad (permitir todo por ahora para desarrollo)
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow all operations on sale_items" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on inventory_movements" ON public.inventory_movements FOR ALL USING (true);

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
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
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