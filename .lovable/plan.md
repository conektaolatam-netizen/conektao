

# Plan: Eliminar columna `menu_data` de `whatsapp_configs`

## Cambios

### 1. Migración SQL
- `ALTER TABLE public.whatsapp_configs DROP COLUMN menu_data;`

### 2. `supabase/functions/generate-alicia/index.ts`
- Línea 328: cambiar `categories_count: config.menu_data?.length || 0` por contar categorías únicas desde los productos ya cargados (variable `products`).

### 3. `src/integrations/supabase/types.ts`
- Se regenera automáticamente tras la migración. No se toca manualmente.

No hay más referencias en el frontend ni en otras edge functions.

