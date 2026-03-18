

# Plan: Corregir que el bot respete `max_suggestions_per_moment = 1`

## Problema
El prompt generado dice `"Menciona hasta 1 producto(s)"` — el LLM interpreta "hasta" como flexible y a veces sugiere 2. Cuando el valor es 1, la instrucción debe ser más estricta y en singular.

## Cambio único

### `supabase/functions/_shared/suggestionFlow.ts`

Ajustar las instrucciones de step1, step2, step3 y globalRules para usar lenguaje singular/estricto cuando `maxSug === 1`:

- **globalRules (línea 35):** `"Máximo 1 sugerencia por MOMENTO"` (sin "(s)")
- **step1 (línea 58):** Cuando `maxSug === 1`: `"Menciona EXACTAMENTE 1 producto del menú"` en vez de `"hasta 1 producto(s)"`
- **step2 (línea 66):** Cuando `maxSug === 1`: `"sugiere EXACTAMENTE 1 complemento natural"` 
- **step3 (línea 71):** Cuando `maxSug === 1`: `"haz EXACTAMENTE 1 última sugerencia breve"`

Implementación concisa — helper inline:
```typescript
const sugLabel = maxSug === 1 ? "EXACTAMENTE 1" : `hasta ${maxSug}`;
const sugNoun = (singular: string, plural: string) => maxSug === 1 ? singular : plural;
```

Y usar `sugLabel` en las 4 instrucciones donde aparece `hasta ${maxSug}`.

## Opcional (limpieza)
- Eliminar el fallback `suggestConfigs.max_suggestions_per_order` en línea 30 (ya no hay registros que lo usen activamente, y la llave nueva ya está en DB). Esto simplifica el código.

## Archivos afectados
| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/suggestionFlow.ts` | Lenguaje singular/estricto para maxSug=1; opcionalmente limpiar fallback viejo |

## Despliegue
Redesplegar `whatsapp-webhook` y `generate-alicia` tras el cambio.

