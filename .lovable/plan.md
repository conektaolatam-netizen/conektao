

# Plan: Sistema de Combos Dinámicos para Alicia

## Resumen

Crear un sistema de combos/combinaciones de productos (ej. pizzas mitad y mitad) mediante dos tablas nuevas en Supabase, una UI de gestión dentro de la configuración de Alicia, y la integración con el webhook de WhatsApp para que Alicia detecte y cotice combos automáticamente.

---

## Paso 1 — Migración de base de datos

Crear las tablas y el trigger de recálculo automático de precios.

```sql
-- Tabla principal de combos
CREATE TABLE public.product_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  calculated_price NUMERIC NOT NULL DEFAULT 0,
  override_price NUMERIC,  -- NULL = usar calculated_price
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ítems que componen cada combo
CREATE TABLE public.product_combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.product_combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fraction NUMERIC NOT NULL DEFAULT 1,   -- 0.5 = mitad, 1 = completo
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_combo_items_combo ON public.product_combo_items(combo_id);
CREATE INDEX idx_combo_items_product ON public.product_combo_items(product_id);
CREATE INDEX idx_combos_restaurant ON public.product_combos(restaurant_id);

-- RLS
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_combo_items ENABLE ROW LEVEL SECURITY;

-- Policies (lectura autenticada por restaurant, escritura owner/admin)
CREATE POLICY "Authenticated read combos" ON public.product_combos
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Owner/admin manage combos" ON public.product_combos
  FOR ALL TO authenticated
  USING (public.can_manage_restaurant(restaurant_id))
  WITH CHECK (public.can_manage_restaurant(restaurant_id));

CREATE POLICY "Authenticated read combo items" ON public.product_combo_items
  FOR SELECT TO authenticated
  USING (combo_id IN (SELECT id FROM public.product_combos WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )));

CREATE POLICY "Owner/admin manage combo items" ON public.product_combo_items
  FOR ALL TO authenticated
  USING (combo_id IN (SELECT id FROM public.product_combos WHERE public.can_manage_restaurant(restaurant_id)))
  WITH CHECK (combo_id IN (SELECT id FROM public.product_combos WHERE public.can_manage_restaurant(restaurant_id)));

-- Función para recalcular el precio de un combo
CREATE OR REPLACE FUNCTION public.recalculate_combo_price(p_combo_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(p.price * ci.fraction * ci.quantity), 0)
  INTO v_total
  FROM product_combo_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.combo_id = p_combo_id;

  UPDATE product_combos SET calculated_price = v_total, updated_at = now()
  WHERE id = p_combo_id;

  RETURN v_total;
END;
$$;

-- Trigger: cuando cambia el precio de un producto, recalcular todos sus combos
CREATE OR REPLACE FUNCTION public.recalculate_combos_on_product_price_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    PERFORM recalculate_combo_price(ci.combo_id)
    FROM product_combo_items ci
    WHERE ci.product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_combos_on_product_price
AFTER UPDATE OF price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.recalculate_combos_on_product_price_change();

-- Trigger: recalcular al insertar/eliminar combo items
CREATE OR REPLACE FUNCTION public.recalculate_combo_on_item_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_combo_price(OLD.combo_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_combo_price(NEW.combo_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_recalc_combo_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.product_combo_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_combo_on_item_change();

-- Vista de precio efectivo
CREATE OR REPLACE FUNCTION public.combo_effective_price(p_combo_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(override_price, calculated_price)
  FROM product_combos WHERE id = p_combo_id;
$$;
```

---

## Paso 2 — UI de gestión de combos

Crear componente `src/components/alicia-config/AliciaConfigCombos.tsx` accesible como tab/sección dentro de `AliciaConfigMenu` o como sección separada en la config de Alicia.

Funcionalidad:
- **Listar combos** activos del restaurante con precio efectivo
- **Crear combo**: seleccionar productos del restaurante, asignar `fraction` (default 1) y `quantity` (default 1), nombre auto-generado (concatenación de productos), editable, descripción opcional, `override_price` opcional
- **Editar combo**: modificar ítems, fracciones, override
- **Eliminar combo**: soft-delete (`is_active = false`)
- **Precio en tiempo real**: calcular y mostrar `SUM(price * fraction * quantity)` mientras se arma el combo, y si hay `override_price` mostrar ambos

---

## Paso 3 — Integrar combos en el webhook de WhatsApp

Modificar `supabase/functions/whatsapp-webhook/index.ts` en los dos puntos donde se cargan productos (líneas ~4207 y ~3833):

1. **Cargar combos** junto a los productos:
```ts
const { data: combos } = await supabase
  .from("product_combos")
  .select("id, name, description, calculated_price, override_price, category_id, categories(name)")
  .eq("restaurant_id", rId)
  .eq("is_active", true);
```

2. **Inyectar combos como "productos virtuales"** en el array de productos antes de pasarlos a `buildMenuFromProducts` y `buildProductEntries`:
```ts
const comboEntries = (combos || []).map(c => ({
  id: c.id,
  name: c.name,
  price: c.override_price ?? c.calculated_price,
  description: c.description || "",
  category_id: c.category_id,
  category_name: c.categories?.name || "Combos",
  is_combo: true,
  requires_packaging: false,
  packaging_price: 0,
  portions: 1,
}));
const allProducts = [...prodsWithCategory, ...comboEntries];
```

3. **`buildMenuFromProducts`**: agregar sección "COMBOS" al menú que se inyecta en el system prompt
4. **`validateOrder`**: los combos ya serán resueltos por `resolveProductEntry` ya que se pasan como entradas con nombre, precio y categoría

---

## Paso 4 — Integrar en `buildMenuFromProducts`

Agregar lógica para detectar productos con `is_combo: true` y agruparlos en una sección especial del menú:

```
🎯 COMBOS Y COMBINACIONES:
Mitad Hawaiana + Mitad Pepperoni Mediana | $22.000
Combo Familiar (Pizza + Bebida + Postre) | $45.000
```

---

## Paso 5 — Registrar sección en AliciaConfigPage

Agregar "Combos" como sección en `SECTIONS` de `AliciaConfigPage.tsx`, renderizando `AliciaConfigCombos` cuando se seleccione, o más simple: agregar un tab dentro de `AliciaConfigMenu` para "Productos" y "Combos".

---

## Detalle Técnico

```text
┌─────────────────────┐       ┌──────────────────────────┐
│  product_combos     │       │  product_combo_items     │
│─────────────────────│       │──────────────────────────│
│ id (PK)             │──┐    │ id (PK)                  │
│ restaurant_id (FK)  │  │    │ combo_id (FK) ───────────┘
│ name                │  │    │ product_id (FK) → products
│ description         │  │    │ fraction (0.5, 1, etc.)  │
│ category_id (FK)    │  │    │ quantity (default 1)     │
│ calculated_price    │  │    └──────────────────────────┘
│ override_price      │  │
│ is_active           │  │    Trigger: INSERT/UPDATE/DELETE
│ created_at          │  │    → recalculate_combo_price()
│ updated_at          │  │
└─────────────────────┘  │    Trigger: UPDATE products.price
                         │    → recalculate_combos_on_product_price_change()
```

**Flujo de precios:**
- `effective_price = COALESCE(override_price, calculated_price)`
- `calculated_price = SUM(product.price × fraction × quantity)`
- Si se actualiza el precio de un producto base → trigger recalcula todos los combos que lo contienen

**Flujo de detección en Alicia:**
- Los combos se inyectan como productos virtuales en el array
- El `productResolver` los resuelve con la misma lógica de scoring
- En `validateOrder`, el precio se valida contra el `effective_price` del combo

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migración SQL | Crear tablas, triggers, RLS |
| `src/components/alicia-config/AliciaConfigCombos.tsx` | Crear (UI gestión combos) |
| `src/components/alicia-config/AliciaConfigMenu.tsx` | Modificar (agregar tab "Combos") |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar (cargar combos, inyectar en menú y validación) |

