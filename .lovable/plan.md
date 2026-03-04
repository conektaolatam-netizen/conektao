

## Plan: Mejorar matching de productos usando `description`, `category_name` e `is_active`

### Problema actual

1. **`buildPriceMap`** usa solo `p.name.toLowerCase()` como clave. Cuando hay dos productos con el mismo nombre (ej: "Pepperoni" a $32K y $45K), el último sobreescribe al primero.
2. **La query de confirmación** (línea 2404) no trae `description`, `category_id` ni `packaging_price` — campos que sí trae la query principal (línea 2637).
3. **No hay lógica** para usar `description` o `categories.name` como criterio de desambiguación cuando el nombre del producto es idéntico.

### Solución (3 cambios quirúrgicos)

---

#### Cambio 1: Completar la query de confirmación (línea 2404)

La query que carga productos al momento de confirmar un pedido está incompleta. Falta `description`, `category_id` y `packaging_price`.

```text
// ANTES (línea 2404):
.select("id, name, price, requires_packaging, portions, categories(name)")

// DESPUÉS:
.select("id, name, price, description, category_id, requires_packaging, packaging_price, portions, categories(name)")
```

También agregar el flatten de `category_name` después de esta query (como se hace en línea 2645-2648), para que `validateOrder` reciba los mismos campos en ambos flujos.

---

#### Cambio 2: Reescribir `buildPriceMap` para manejar duplicados con contexto

En vez de `Record<string, number>`, usar un array de entradas que preserven `description` y `category_name`:

```typescript
type ProductEntry = { name: string; price: number; description: string; categoryName: string };

function buildPriceMap(products: any[]): ProductEntry[] {
  return products
    .filter((p: any) => p.name && p.price)
    .map((p: any) => ({
      name: (p.name || "").toLowerCase().trim(),
      price: Number(p.price),
      description: (p.description || "").toLowerCase().trim(),
      categoryName: (p.category_name || p.categories?.name || "").toLowerCase().trim(),
    }));
}
```

Esto elimina el problema de sobreescritura: cada producto es una entrada separada.

---

#### Cambio 3: Reescribir el bloque de matching en `validateOrder` (líneas 1061-1096)

El nuevo algoritmo de scoring incorpora `description` y `category_name`:

1. **Exact match por nombre** → break inmediato (si nombre es único)
2. **Si hay duplicados por nombre**, desambiguar con:
   - Tokens del item que aparezcan en `description` (+5 por token, ya que "Personal"/"Mediana" está ahí)
   - Tokens del item que aparezcan en `categoryName` (+4 por token, ej: "Pizzas - Personal")
3. **Token overlap por nombre** (+3 por token, como antes)
4. **Penalización** por tokens extra (-1)
5. **Limpieza de puntuación** (guiones, comas) antes de tokenizar

```text
Ejemplo con "Pizza Pepperoni - Personal":
  itemTokens: ["pizza", "pepperoni", "personal"]

  Producto A: name="pepperoni", desc="mozzarella, pepperoni y parmesano - personal", cat="pizzas - personal"
    → name tokens: +3 (pepperoni)
    → desc tokens: +5 (pepperoni) +5 (personal) = +10
    → cat tokens:  +4 (personal) = +4
    → Total: 17

  Producto B: name="pepperoni", desc="mozzarella, pepperoni y parmesano - mediana", cat="pizzas - mediana"
    → name tokens: +3 (pepperoni)
    → desc tokens: +5 (pepperoni) = +5
    → cat tokens:  0
    → Total: 8

  ✅ Producto A gana con score 17 vs 8
```

#### Cambio en `buildPackagingMap`

Aplicar la misma lógica de clave compuesta para que el packaging también se resuelva correctamente cuando hay nombres duplicados. El packaging map pasará a ser un array similar al price map.

---

### Qué NO se modifica

- Lógica de recálculo financiero (líneas 1148-1170) — intacta
- `getPackagingCost()` — intacta
- `saveOrder()`, `buildPrompt()`, `buildMenuFromProducts()` — intactos
- No hay cambios en BD, no hay migraciones
- Solo se modifica `supabase/functions/whatsapp-webhook/index.ts`

### Archivos afectados

- `supabase/functions/whatsapp-webhook/index.ts`:
  - Línea 2404: completar SELECT de productos en confirmación
  - Líneas 2408: agregar flatten de category_name
  - Líneas 1002-1010: reescribir `buildPriceMap` → array con contexto
  - Líneas 1013-1024: reescribir `buildPackagingMap` → array con contexto
  - Líneas 1046-1047: adaptar llamadas a nuevos mapas
  - Líneas 1061-1096: nuevo scoring con description + category
  - Líneas 1110-1124: adaptar lookup de packaging al nuevo formato

