

# Plan: Inyectar sugerencias dentro del FLUJO DE PEDIDO

## Situación actual

- `buildCoreSystemPrompt(assistantName, escalationPhone)` define el FLUJO DE PEDIDO (pasos 1-7) como texto estático
- `buildSuggestionFlow(suggestConfigs)` retorna un bloque de texto separado que se concatena al final del business config
- El modelo ve las sugerencias como un apéndice opcional, no como parte del flujo

## Cambio de arquitectura

### 1. Modificar `suggestionFlow.ts` — cambiar la firma y retorno

**Antes**: `buildSuggestionFlow(suggestConfigs): string` → retorna un bloque de texto

**Después**: `buildSuggestionFlow(suggestConfigs): { globalRules: string; step1: string; step2: string; step3: string }` → retorna fragmentos por paso

- `globalRules`: reglas generales (max, respect_first_no, no_prices) — se inyecta ANTES del flujo
- `step1`: texto para inyectar después del paso 1 (greeting)
- `step2`: texto para inyectar después del paso 2 (complements + upsizing)
- `step3`: texto para inyectar después del paso 3 (before close)
- Si `enabled = false`: todos los campos son string vacío

### 2. Modificar `buildCoreSystemPrompt` en ambos archivos

Agregar un tercer parámetro: `suggestConfigs`

```
function buildCoreSystemPrompt(assistantName, escalationPhone, suggestConfigs): string
```

Dentro de la función:
- Llamar a `buildSuggestionFlow(suggestConfigs)` para obtener los fragmentos
- Inyectar `globalRules` justo antes de "FLUJO DE PEDIDO"
- Inyectar `step1` después del paso 1
- Inyectar `step2` después del paso 2
- Inyectar `step3` después del paso 3

### 3. Eliminar el `upsellBlock` del business config

En ambos archivos (`generate-alicia` y `whatsapp-webhook`):
- Ya no se genera `upsellBlock` en `buildBusinessConfigPrompt` / `buildDynamicPrompt`
- Ya no se concatena `${upsellBlock}` al final del template

### 4. Actualizar las llamadas a `buildCoreSystemPrompt`

Pasar `suggestConfigs` como tercer argumento en todos los call sites (ambos archivos).

## Ejemplo del prompt final resultante

Con `suggest_on_greeting=true`, `suggest_complements=true`, `suggest_upsizing=true`, `suggest_before_close=true`, `max_suggestions_per_order=2`, `respect_first_no=true`, `no_prices_in_suggestions=true`:

```text
...
CONTEXTO: Lee historial COMPLETO. Si ya dieron info, NO la pidas de nuevo

REGLAS DE SUGERENCIAS:
- Máximo 2 sugerencias por pedido. Lleva la cuenta internamente
- Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación
- NO menciones precios al sugerir
- Prioriza PRODUCTOS RECOMENDADOS HOY en tus sugerencias
- NO repitas la misma sugerencia dos veces
- NO sugieras productos que el cliente ya pidió

FLUJO DE PEDIDO (un paso por mensaje, NO te saltes pasos):
1. Saluda y pregunta qué quiere
   → Después de saludar, menciona naturalmente 1-2 productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"
2. Anota cada producto. Después de cada uno pregunta: "Algo más?"
   → Si el producto tiene tamaño mayor disponible en el menú, ofrécelo. Ej: "También lo tenemos en [tamaño mayor], ¿prefieres ese?"
   → Antes de preguntar "¿algo más?", sugiere UN complemento natural. Ej: "Para acompañar te queda genial un [complemento]. ¿Algo más?"
3. Cuando diga "nada más" → pregunta: recoger o domicilio
   → Antes de pasar a recoger/domicilio, haz UNA última sugerencia breve. Ej: "Antes de cerrar, ¿no te provoca un [producto]?"
4. Si domicilio → pide nombre y dirección...
5. Indica datos de pago
6. Presenta resumen...
7. El sistema guarda el pedido...
```

Con `enabled = false`: el flujo queda exactamente igual que antes, sin ninguna inyección.

## Archivos afectados
1. `supabase/functions/_shared/suggestionFlow.ts` — cambiar retorno a objeto con fragmentos
2. `supabase/functions/generate-alicia/index.ts` — pasar suggestConfigs a buildCoreSystemPrompt, eliminar upsellBlock
3. `supabase/functions/whatsapp-webhook/index.ts` — pasar suggestConfigs a buildCoreSystemPrompt, eliminar upsellBlock

## Sin cambios en
- Base de datos, UI, estructura de suggest_configs
- Pasos 4-7 del flujo (no reciben inyecciones)
- Lógica de promoted_products, menú, personalidad

