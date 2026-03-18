

# Plan: Inyectar greeting en paso 1 del flujo + usar max dinámico en sugerencias

## Problema actual
- El `SALUDO` literal en la sección CONFIG (línea 1324) compite con la instrucción del paso 1 del flujo (línea 1034), y el modelo siempre copia el literal.
- `suggestionFlow.ts` tiene valores hardcodeados ("1-2 productos", "UN complemento") en vez de usar `max_suggestions_per_order`.

## Cambios

### 1. `suggestionFlow.ts` — Usar `maxSug` dinámico en todos los pasos

**Paso 1** (línea 47-48): Cambiar `"1-2 productos"` → usar `maxSug` del config.
**Paso 2** (líneas 55-60): Cambiar `"UN complemento"` → cantidad dinámica.
**Paso 3** (línea 65-66): Cambiar `"UNA última sugerencia"` → cantidad dinámica.

Además, pasar `greeting` como segundo parámetro a `buildSuggestionFlow` para que `step1` incluya el mensaje de saludo directamente.

```typescript
export function buildSuggestionFlow(suggestConfigs: any, greetingMessage?: string): SuggestionFragments {
```

En `step1`, cuando `suggest_on_greeting` es true:
```
→ Usa como base este saludo: "${greetingMessage}". Personalízalo y menciona naturalmente hasta ${maxSug} productos populares o recomendados
```

Cuando `suggest_on_greeting` es false pero hay `greetingMessage`:
```
// No se agrega sugerencia, pero el greeting se inyecta en step1 igual
step1 = `\n   → Usa como base este saludo: "${greetingMessage}"`
```

### 2. `whatsapp-webhook/index.ts` — `buildCoreSystemPrompt`

Agregar `greetingMessage` como parámetro:
```typescript
function buildCoreSystemPrompt(assistantName, escalationPhone, suggestConfigs?, greetingMessage?): string {
  const sf = buildSuggestionFlow(suggestConfigs || {}, greetingMessage);
```

Llamada en línea 1120:
```typescript
const core = buildCoreSystemPrompt(assistantName, escalation.human_phone || "", suggestConfigs, greeting);
```

### 3. `whatsapp-webhook/index.ts` — Eliminar SALUDO de la sección CONFIG

Eliminar líneas 1324-1325 (`SALUDO (referencia de tono...)` y la línea de IMPORTANTE) para que no haya texto de saludo duplicado que confunda al modelo.

## Resultado

- El greeting vive SOLO en el paso 1 del flujo, junto a la instrucción de sugerencias
- Las cantidades de sugerencias son dinámicas según `max_suggestions_per_order`
- No hay texto literal de saludo suelto en el prompt que el modelo pueda copiar

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/suggestionFlow.ts` | Recibir `greetingMessage`, usar `maxSug` en todos los pasos, inyectar greeting en step1 |
| `supabase/functions/whatsapp-webhook/index.ts` | Pasar `greeting` a `buildCoreSystemPrompt` → `buildSuggestionFlow`, eliminar SALUDO de CONFIG |

