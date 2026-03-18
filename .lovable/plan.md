

# Plan: Inyectar `sf.step1` directamente en el SALUDO cuando sugerencias están activas

## Cambio único

**Archivo:** `supabase/functions/whatsapp-webhook/index.ts`, líneas 1324-1325

Construir `sf` con `buildSuggestionFlow(suggestConfigs)` dentro de `buildDynamicPrompt` (ya tiene `suggestConfigs` en línea 1172), y si `sf.step1` tiene contenido, concatenarlo al greeting en la línea del SALUDO.

**Antes:**
```
SALUDO (referencia de tono, NO copiar textualmente): "${greeting}"
- IMPORTANTE: Al saludar, usa este mensaje como BASE pero SIEMPRE personalízalo e incluye las sugerencias del paso 1 del flujo si aplican
```

**Después:**
```typescript
const sf = buildSuggestionFlow(suggestConfigs);
const greetingLine = sf.step1
  ? `SALUDO: "${greeting}"\n${sf.step1}`
  : `SALUDO: "${greeting}"`;
```

Y en el template string usar `${greetingLine}` en lugar de la línea hardcodeada.

Esto hace que cuando `enabled=true` y `suggest_on_greeting=true`, el texto del saludo lleve pegada la instrucción de mencionar productos, y el modelo no pueda ignorarla. Cuando están desactivadas, el saludo queda igual que antes.

## Archivos
| Archivo | Cambio |
|---------|--------|
| `supabase/functions/whatsapp-webhook/index.ts` | Crear `sf` + `greetingLine` antes del template, reemplazar líneas 1324-1325 |

