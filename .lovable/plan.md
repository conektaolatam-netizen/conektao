

# Plan: Validar `radius` no vacío en vez de solo existencia

Cambiar la condición en ambos archivos de `delivery.radius` (truthy) a `delivery.radius && delivery.radius !== ""` para evitar que un string vacío genere texto en el prompt.

## Archivos

1. **`supabase/functions/generate-alicia/index.ts`** (línea 179)
2. **`supabase/functions/whatsapp-webhook/index.ts`** (línea 1299)

En ambos, cambiar:
```typescript
const radiusInfo = delivery.radius ? ...
```
a:
```typescript
const radiusInfo = delivery.radius && delivery.radius !== "" ? ...
```

