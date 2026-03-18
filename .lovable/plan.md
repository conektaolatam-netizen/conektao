

# Plan: Eliminar `suggest_upsizing` del sistema

## Cambios

### 1. `src/components/alicia-config/AliciaConfigUpselling.tsx`
- Eliminar `suggest_upsizing` de la interfaz `SuggestConfig` (línea 16)
- Eliminar `suggest_upsizing: true` de `DEFAULT_CONFIG` (línea 48)
- Eliminar la entrada del array `switches` con key `"suggest_upsizing"` (línea 169)
- Eliminar el import de `ArrowUpCircle` (línea 8)

### 2. `supabase/functions/_shared/suggestionFlow.ts`
- Eliminar las líneas 64-69: la variable `hasUpsizing` y su bloque `if` que inyecta la instrucción de tamaños mayores en `step2`

Ambos cambios son aditivos/sustractivos simples — no afectan ninguna otra lógica existente.

