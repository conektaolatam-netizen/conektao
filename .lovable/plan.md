

# Plan: Integrar sugerencias en el flujo conversacional y eliminar duplicación

## Análisis actual

- **Duplicación confirmada**: La lógica de `upsellBlock` es idéntica en `generate-alicia/index.ts` (líneas 210-222) y `whatsapp-webhook/index.ts` (líneas 1295-1307).
- **Problema**: Las sugerencias se inyectan como bloque separado al final del prompt (`${upsellBlock}`), desconectadas del FLUJO DE PEDIDO.
- **FLUJO DE PEDIDO**: Definido en el core prompt (inmutable entre ambos archivos), pasos 1-7.

## Cambios

### 1. Crear helper compartido: `supabase/functions/_shared/suggestionFlow.ts`

Nueva función exportada:

```
buildSuggestionFlow(suggestConfigs: any): string
```

**Si `enabled = false`**: retorna `"SUGERENCIAS: NO hacer sugerencias de venta adicional."`.

**Si `enabled = true`**: retorna un bloque de texto que **reemplaza** el antiguo `upsellBlock` con instrucciones integradas al flujo. En lugar de listar "momentos", describe el comportamiento esperado dentro de cada paso del pedido:

```text
SUGERENCIAS INTEGRADAS AL FLUJO:
- Máximo {N} sugerencias por momento. Lleva la cuenta internamente
- {Si respect_first_no} Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación
- {Si no_prices_in_suggestions} NO menciones precios al sugerir
- Prioriza PRODUCTOS RECOMENDADOS HOY

EN EL PASO 1 (saludo):
{Si suggest_on_greeting} Después de saludar, menciona naturalmente 1-2 productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"

EN EL PASO 2 (después de anotar producto principal):
{Si suggest_complements} Antes de preguntar "¿algo más?", sugiere UN complemento natural (bebida, entrada, postre). Ej: "Para acompañar te queda genial un [complemento]. ¿Algo más?"
{Si suggest_upsizing} Si el producto tiene tamaño mayor disponible en el menú, ofrécelo primero. Ej: "También lo tenemos en [tamaño mayor], ¿prefieres ese?"

EN EL PASO 3 (antes de cerrar):
{Si suggest_before_close} Cuando diga "nada más", haz UNA última sugerencia breve antes de pasar a recoger/domicilio. Ej: "Antes de cerrar, ¿no te provoca un [producto]?"

REGLAS:
- NO repitas la misma sugerencia dos veces
- NO sugieras productos que el cliente ya pidió
- Si ya alcanzaste el máximo de sugerencias → pasa al siguiente paso sin sugerir
```

Cada bloque condicional se incluye o excluye según los flags. Esto reemplaza la lista genérica de "momentos" con instrucciones concretas vinculadas a pasos del flujo.

### 2. Modificar `generate-alicia/index.ts`

- Importar `buildSuggestionFlow` desde `../_shared/suggestionFlow.ts`
- Eliminar las líneas 210-222 (lógica local de `upsellBlock`)
- Reemplazar con: `const upsellBlock = buildSuggestionFlow(suggestConfigs);`
- La variable `upsellBlock` sigue inyectándose en el mismo lugar del template string (línea 246), sin cambios en la estructura del prompt

### 3. Modificar `whatsapp-webhook/index.ts`

- Importar `buildSuggestionFlow` desde `../_shared/suggestionFlow.ts`
- Eliminar las líneas 1295-1307 (lógica local de `upsellBlock`)
- Reemplazar con: `const upsellBlock = buildSuggestionFlow(suggestConfigs);`
- Sin otros cambios en el archivo

### Sin cambios en
- Core prompt (FLUJO DE PEDIDO pasos 1-7 no se tocan)
- Base de datos, estructura de `suggest_configs`, UI
- Otras pestañas de configuración
- Lógica de `promoted_products` (sigue siendo referenciada como "PRODUCTOS RECOMENDADOS HOY" desde el menú/config block)

## Archivos afectados
1. `supabase/functions/_shared/suggestionFlow.ts` — **nuevo**
2. `supabase/functions/generate-alicia/index.ts` — eliminar bloque duplicado, importar helper
3. `supabase/functions/whatsapp-webhook/index.ts` — eliminar bloque duplicado, importar helper

