

## Plan: Interceptor backend para preguntas de composición de combos

### Problema
Cuando un cliente pregunta "¿qué trae el Combo Familiar?" por WhatsApp, actualmente la IA responde usando solo el `description` del combo (o alucina los componentes). No existe un interceptor que consulte los datos reales de `product_combo_items`.

### Solución
Crear una función `handleComboCompositionQuestion` siguiendo el mismo patrón exacto de `handlePriceQuestion`, que intercepte preguntas de composición y responda con los componentes reales de la DB.

### Archivo a modificar
`supabase/functions/whatsapp-webhook/index.ts`

### Cambios específicos

**1. Nueva función `handleComboCompositionQuestion` (junto a `handlePriceQuestion`, ~línea 2030)**

- Detecta patrones como: "qué trae", "qué incluye", "qué viene en", "de qué es", "qué tiene", "contenido del", "componentes del"
- Extrae el nombre del combo del mensaje
- Busca match en `effectiveProducts` filtrando solo los que tienen `is_combo: true`
- Recibe un parámetro adicional: un mapa de `comboItems` precargado con los componentes de cada combo (nombre del producto + fraction + quantity)
- Construye respuesta con lista de componentes reales, ej:
  ```
  El Combo Familiar incluye:
  - 1x Pizza Pepperoni
  - 1x Bebida Grande
  - 1x Postre del Día
  Precio: $45.000
  ¿Te gustaría pedirlo?
  ```

**2. Precarga de combo items (en las dos zonas donde se cargan combos: ~línea 4262 y ~línea 3862)**

Después de cargar `product_combos`, hacer un query adicional:
```sql
SELECT ci.combo_id, ci.fraction, ci.quantity, p.name as product_name
FROM product_combo_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.combo_id IN (ids de combos activos)
```

Construir un `Map<comboId, items[]>` y pasarlo al interceptor.

**3. Invocación del interceptor (junto al interceptor de precio, ~línea 4534)**

Después del check de `handlePriceQuestion`, agregar:
```typescript
const compositionAnswer = handleComboCompositionQuestion(
  userTextForPrice, effectiveProducts, comboItemsMap
);
if (compositionAnswer) {
  // Misma lógica: guardar en mensajes, enviar WA, return early
}
```

### Patrones de detección (español colombiano)
```
/(?:qu[ée])\s+(?:trae|incluye|tiene|lleva|viene|contiene)/i
/(?:de\s+qu[ée])\s+(?:es|está|consta)/i
/(?:qu[ée]\s+(?:productos?|cosas?))\s+(?:trae|incluye|tiene|lleva)/i
/(?:contenido|composici[oó]n|componentes?)\s+(?:de(?:l)?)/i
```

### Principio aplicado
100% backend — la IA nunca responde sobre composición de combos. Datos reales de `product_combo_items` join `products`.

