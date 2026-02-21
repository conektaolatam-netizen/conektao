

## Base de Datos Multi-Negocio — Migracion Estructural

### Diagnostico actual

El sistema tiene dos patrones de ownership incompatibles:

**Tablas CON `restaurant_id` (47 tablas):** whatsapp_orders, whatsapp_conversations, whatsapp_configs, ingredients, kitchen_orders, cash_registers, audit_logs, etc. — Estas ya son multi-negocio.

**Tablas SIN `restaurant_id` (usan `user_id`):** products, categories, inventory, sales, recipes, notifications — Estas son el problema. Si dos negocios tienen el mismo owner o un empleado cambia de restaurante, los datos se mezclan.

### Plan de implementacion

---

### Paso 1 — NO crear tabla `businesses` nueva

La tabla `restaurants` ya cumple exactamente el rol de `businesses`:
- `id`, `name`, `owner_id`, `address`, `created_at`
- Ya es FK de 47 tablas
- `whatsapp_configs` ya tiene `restaurant_id` + `whatsapp_phone_number_id`

Crear una tabla `businesses` separada duplicaria la logica y romperia todo lo existente. En su lugar, se enriquece `restaurants` con los campos faltantes.

**Migracion SQL:**
```sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
```

Despues, sincronizar datos existentes de La Barra desde `whatsapp_configs`:
```sql
UPDATE restaurants
SET whatsapp_number = '573014017559',
    contact_email = (SELECT order_email FROM whatsapp_configs WHERE restaurant_id = restaurants.id LIMIT 1),
    is_active = true
WHERE id = '899cb7a7-7de1-47c7-a684-f24658309755';
```

---

### Paso 2 — Agregar `restaurant_id` a tablas criticas

Las 6 tablas que usan `user_id` sin `restaurant_id` necesitan la columna:

```sql
-- products
ALTER TABLE products ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);

-- categories  
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);

-- inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);

-- sales (ya tiene user_id, necesita restaurant_id)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);

-- recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);

-- notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);
```

---

### Paso 3 — Migrar datos historicos

Poblar `restaurant_id` para todos los registros existentes usando la relacion `user_id -> profiles.restaurant_id`:

```sql
UPDATE products SET restaurant_id = (
  SELECT restaurant_id FROM profiles WHERE profiles.id = products.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

-- Mismo patron para categories, inventory, sales, recipes, notifications
```

---

### Paso 4 — Indices para performance

```sql
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_restaurant ON sales(restaurant_id);
```

---

### Paso 5 — Mapeo automatico WhatsApp -> business_id

Ya funciona asi en el webhook:
1. Meta envia `phone_number_id` en el payload
2. Webhook busca `whatsapp_configs WHERE whatsapp_phone_number_id = phone_number_id`
3. Obtiene `restaurant_id` (= business_id)
4. Todas las operaciones usan ese `restaurant_id`

Para que sea mas robusto, agregar indice unico:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_configs_phone 
  ON whatsapp_configs(whatsapp_phone_number_id);
```

---

### Paso 6 — Actualizar codigo frontend

Modificar los hooks y componentes que consultan `products`, `sales`, etc. por `user_id` para que tambien filtren por `restaurant_id`:

**Archivos a modificar:**
- `src/components/POSSystem.tsx` — `loadProducts()` filtrar por `restaurant_id` en vez de solo `user_id`
- `src/components/POSBilling.tsx` — mismo cambio en `loadProducts()`
- `src/context/DataContext.tsx` — `loadProducts()` y `loadSales()` usar `restaurant_id`
- `src/hooks/useAuth.tsx` — ya provee `profile.restaurant_id`, no necesita cambio

**Patron de cambio (ejemplo products):**
```typescript
// ANTES
.eq('user_id', user.id)

// DESPUES (retrocompatible)
.eq('restaurant_id', profile.restaurant_id)
```

---

### Paso 7 — Actualizar webhook para guardar `restaurant_id` en productos

Cuando se crean productos desde el menu import o dashboard, asegurar que `restaurant_id` se incluya en el INSERT.

---

### Resumen de migracion SQL total

| Accion | Tabla | Tipo |
|---|---|---|
| Agregar columnas branch, whatsapp_number, etc. | restaurants | ALTER |
| Agregar restaurant_id | products | ALTER |
| Agregar restaurant_id | categories | ALTER |
| Agregar restaurant_id | inventory | ALTER |
| Agregar restaurant_id | sales | ALTER |
| Agregar restaurant_id | recipes | ALTER |
| Agregar restaurant_id | notifications | ALTER |
| Poblar restaurant_id desde profiles | 6 tablas | UPDATE |
| Indice unico phone_number_id | whatsapp_configs | INDEX |
| Indices de busqueda | 4 tablas | INDEX |

### Lo que NO se toca

- Tabla `whatsapp_configs` (ya es multi-negocio)
- Tabla `whatsapp_orders` (ya tiene restaurant_id)
- Tabla `whatsapp_conversations` (ya tiene restaurant_id)
- Tabla `ingredients` (ya tiene restaurant_id)
- Edge function webhook (ya resuelve por phone_number_id)
- Flujo de pedidos de La Barra en produccion

### Riesgo y mitigacion

El unico riesgo es que los UPDATEs de migracion de datos fallen si algun `user_id` no tiene `profiles.restaurant_id`. Mitigacion: usar LEFT JOIN y dejar NULL para huerfanos, verificar despues con query de auditoria.

