

# Plan: Agregar `radius` al prompt de domicilios

## Cambio

Agregar el valor de `delivery.radius` (si existe) al bloque de domicilios en el prompt, tanto en `generate-alicia` como en `whatsapp-webhook`. Es informativo — igual que `delivery_travel` o `may_extend`.

## Archivos a modificar

### 1. `supabase/functions/generate-alicia/index.ts` (líneas 180-184)

En el bloque de delivery, si `delivery.radius` existe, incluirlo:

```
DOMICILIO GRATIS: Ática, Foret, ... Radio de cobertura: 5 km. El domicilio se paga...
```

Lógica:
```typescript
const radiusInfo = delivery.radius ? ` Radio de cobertura: ${delivery.radius}.` : "";
// Insertar radiusInfo en deliveryBlock
```

### 2. `supabase/functions/whatsapp-webhook/index.ts` (líneas 1299-1307)

Mismo cambio — agregar `radius` al deliveryBlock si existe.

## Lo que NO se toca

- UI de `/alicia/config` (el campo `radius` ya es editable en `AliciaConfigDelivery.tsx`)
- Lógica del bot, flujo de pedidos, validaciones
- No se agrega ningún campo nuevo a la DB

## Resultado

Si el cliente pregunta "¿hasta dónde hacen domicilio?", Alicia podrá responder usando el radio configurado.

