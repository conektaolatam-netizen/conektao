

# Plan: Productos destacados con selector de menú y notas por categoría

## Resumen
Reemplazar el input de texto libre en "Productos destacados" por un selector tipo menú con checkboxes, agrupado por categoría, que permite seleccionar productos activos y agregarles una nota descriptiva. El formato en DB cambia de `string[]` a un JSON estructurado por categoría.

## Formato de datos en `whatsapp_configs.promoted_products`

```text
Antes:  ["Pizza Margarita", "Combo Familiar"]

Ahora:  [
  {
    "category": "Entradas",
    "products": [
      { "product_id": "uuid-1", "name": "Nuditos de Ajo", "note": "recién salidos del horno, son deliciosos" }
    ]
  },
  {
    "category": "Pizzas",
    "products": [
      { "product_id": "uuid-2", "name": "Pizza Margarita", "note": "" }
    ]
  }
]
```

## Cambios

### 1. `src/components/alicia-config/AliciaConfigUpselling.tsx`
- Importar `supabase`, `useEffect`, `Collapsible`, `Checkbox`, `Textarea`
- Cargar productos activos desde Supabase agrupados por categoría (mismo patrón que `AliciaConfigMenu.groupProducts`)
- Reemplazar el input + badge de texto libre por un listado colapsable por categoría con checkboxes en cada producto
- Cuando un producto se selecciona, mostrar debajo un `Input`/`Textarea` para la nota descriptiva
- Mostrar resumen de seleccionados con sus notas
- Al guardar, construir el JSON estructurado por categoría y guardar en `promoted_products`
- Backward compatibility: si `promoted_products` es `string[]` legacy, migrar a nuevo formato al cargar

### 2. `supabase/functions/generate-alicia/index.ts` (línea ~163)
- Actualizar parsing de `promoted` para soportar nuevo formato:
  - Si es array de strings (legacy): `⭐ nombre`
  - Si es array de objetos con categorías: iterar categorías → productos, mostrar `⭐ nombre — nota` cuando hay nota

### 3. `supabase/functions/whatsapp-webhook/index.ts` (líneas ~1085-1094)
- Misma actualización en `buildPrompt`: detectar formato nuevo vs legacy y construir el bloque `PRODUCTOS RECOMENDADOS HOY` con notas cuando existan

## Sin cambios en DB
El campo `promoted_products` es JSONB, soporta el nuevo formato sin migración.

