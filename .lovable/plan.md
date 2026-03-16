# Plan: Refactor completo de Sugerencias (Upselling)

## Resumen

Renombrar `sales_rules` → `suggest_configs`, usar `enabled` como puerta principal, eliminar prompt hardcodeado de sugerencias, rediseñar UI, y alinear todo el sistema.

## Cambios

### 1. Migración SQL: Renombrar columna

```sql
ALTER TABLE public.whatsapp_configs RENAME COLUMN sales_rules TO suggest_configs;
```

### 2. `whatsapp-webhook/index.ts`

**a) Eliminar sección hardcodeada de sugerencias del core prompt (líneas 1020-1050)**  
Eliminar el bloque "VENTAS Y RECOMENDACIONES" y los 4 momentos hardcodeados (AL SALUDAR, CUANDO PIDEN PRODUCTO, UPSELLING DE TAMAÑOS, ANTES DE CERRAR). También cambia la línea 1062 que menciona sugerencias en el flujo de pedido por 'Saluda y pregunta qué quiere'.

**b) Cambiar referencia `sales_rules` → `suggest_configs` (línea 1189)**

```typescript
const suggestConfigs = config.suggest_configs || {};
```

**c) Cambiar gate principal de `suggest_complements` a `enabled` (línea 1328)**

```typescript
if (suggestConfigs.enabled) {
```

Mantener la lógica interna de momentos exactamente igual. Cambiar `salesRules` → `suggestConfigs` en todas las referencias.

**d) `max_suggestions_per_order` — ya se usa correctamente** (línea 1329). Sin cambios.

### 3. `generate-alicia/index.ts`

**a) Cambiar `sales_rules` → `suggest_configs` (línea 117)**

**b) Cambiar gate principal de `suggest_complements` a `enabled` (línea 212)**
Misma lógica que webhook. Mantener momentos individuales iguales.

### 4. `AliciaConfigUpselling.tsx` — Rediseño completo

Eliminar `rules[]` (trigger/suggestion) de la UI. Nuevo modelo:

```typescript
{
  enabled: boolean,
  respect_first_no: boolean,
  suggest_upsizing: boolean, 
  suggest_complements: boolean,
  suggest_on_greeting: boolean,
  suggest_before_close: boolean,
  no_prices_in_suggestions: boolean,
  max_suggestions_per_order: number (1-5)
}
```

Controles UI:

- **Switch principal**: `enabled` — activa/desactiva todo el sistema
- **Switch**: `suggest_on_greeting` — "Sugerir al saludar"
- **Switch**: `suggest_complements` — "Sugerir complementos"
- **Switch**: `suggest_upsizing` — "Sugerir tamaños mayores"
- **Switch**: `suggest_before_close` — "Sugerir antes de cerrar pedido"
- **Switch**: `no_prices_in_suggestions` — "No mencionar precios en sugerencias"
- **Switch**: `respect_first_no` — "Respetar el primer 'no'"
- **Select 1-5**: `max_suggestions_per_order` — "Máximo de sugerencias por momento"

Los switches individuales se muestran solo cuando `enabled === true`.

### 5. `AliciaConfigPage.tsx`

Cambiar referencia de `checkFields: ["sales_rules"]` → `checkFields: ["suggest_configs"]`.

Guardar con: `onSave("suggest_configs", { ... })`.

### 6. Verificación final

- Ambas edge functions leen `suggest_configs` (no `sales_rules`)
- Si `enabled === false` → no se inyecta bloque de sugerencias al prompt
- Si `enabled === true` → se genera dinámicamente basado en los flags individuales
- No quedan referencias a `sales_rules` en el código
- No se eliminan datos antiguos en DB (la migración solo renombra)
- `rules[]` existentes en DB se ignoran sin eliminar