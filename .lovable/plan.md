

# Plan: Fix greeting product suggestions + "no" interpretation

## Problem 1 — Greeting ignores product suggestions
**Root cause**: Line 1324 in `buildDynamicPrompt` outputs `SALUDO: "${greeting}"` as a quoted literal. The model treats it as exact text to copy, overriding the dynamic `sf.step1` instruction on line 1034 that says to mention 1-2 products.

**Fix** in `supabase/functions/whatsapp-webhook/index.ts` line 1324:
Change from:
```
SALUDO: "${greeting}"
```
To:
```
SALUDO (referencia de tono, NO copiar textualmente): "${greeting}"
- IMPORTANTE: Al saludar, usa este mensaje como BASE pero SIEMPRE personalízalo e incluye las sugerencias del paso 1 del flujo si aplican
```

This tells the model the greeting is a tone reference, not verbatim text, so it will naturally incorporate the `sf.step1` product suggestions.

## Problem 2 — "No" to "¿Algo más?" kills all suggestions
**Root cause**: Line 33 in `suggestionFlow.ts` says: *"Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación"*. When the client says "no" to "¿Algo más?", the model interprets this as rejecting a suggestion.

**Fix** in `supabase/functions/_shared/suggestionFlow.ts` line 33:
Change from:
```
"- Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación"
```
To:
```
"- Si el cliente rechaza UNA sugerencia específica de producto (ej: 'no quiero eso', 'no gracias' a un producto sugerido) → NO sugieras más en toda la conversación"
"- IMPORTANTE: Cuando el cliente dice 'no' a '¿Algo más?' NO es un rechazo de sugerencia — es que terminó de pedir. Puedes seguir sugiriendo en pasos posteriores"
```

## Files modified
| File | Lines | Change |
|------|-------|--------|
| `supabase/functions/whatsapp-webhook/index.ts` | ~1324 | Reword SALUDO label to prevent verbatim copying |
| `supabase/functions/_shared/suggestionFlow.ts` | ~33 | Clarify that "no" to "¿Algo más?" ≠ rejection of suggestion |

## What stays the same
- No changes to business logic, ordering flow, or product data
- The `sf.step1` dynamic injection remains untouched — it already works correctly
- The `greeting` variable keeps coming from the config as before

