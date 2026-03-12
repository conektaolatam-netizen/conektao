

# Analysis: Why Alicia isn't making more recommendations

## Root Cause

There are **two conflicting instruction blocks** in the prompt, and the restrictive one wins:

### Block 1: Core Prompt (lines 1020-1050) — ENCOURAGES recommendations
This is in `buildCoreSystemPrompt` and tells the AI to recommend at 4 moments: greeting, after a main product, size upselling, and before closing. This is the block you likely enhanced.

### Block 2: Dynamic Config (line 1356-1358) — RESTRICTS recommendations
This is in `buildDynamicPrompt` and reads from `whatsapp_configs.sales_rules`. For La Barra it currently says:

```
"SUGERENCIA SUAVE: Máximo 1 sugerencia por pedido. Si dice 'no' → cero insistencia. Solo ANTES del paso de entrega. No menciones precios en sugerencias."
```

**The dynamic block appears AFTER the core block in the final prompt** (core + "\n\n" + dynamic), so the AI treats it as the more specific/recent instruction and follows it — limiting itself to 1 suggestion maximum, only before delivery step.

### Additionally: Memory knowledge conflict
The saved project memory (`whatsapp-soft-upselling`) reinforces the restrictive behavior: "MAXIMUM of one suggestion per order... must not insist if ignored... never list more than two options."

## What needs to change

### Change 1: Update `upsellBlock` logic to support the new recommendation behavior
The `salesRules.suggest_complements` branch (line 1356) needs to align with the core prompt's 4-moment recommendation strategy instead of overriding it with "Máximo 1, solo antes de entrega."

Proposed new upsell block when `suggest_complements` is true:
```
RECOMENDACIONES ACTIVAS: Sugiere productos en los momentos indicados en las reglas de recomendación.
Máximo {max_suggestions_per_order} sugerencias por momento. Si dice "no" → cero insistencia.
{no_prices_in_suggestions ? "No menciones precios en sugerencias." : ""}
Usa los PRODUCTOS RECOMENDADOS HOY como prioridad en tus sugerencias.
```

### Change 2: Add `sales_rules` fields to support granular control
Add new optional fields to `sales_rules` config:
- `suggest_on_greeting` (bool, default true) — recommend on hello
- `suggest_complements` (bool, existing) — suggest after main product  
- `suggest_upsizing` (bool, default true) — mention bigger sizes
- `suggest_before_close` (bool, default true) — last suggestion before delivery step

This way the upsell block dynamically enables/disables each of the 4 moments from core, instead of blanket-restricting everything.

### Change 3: Ensure `promoted_products` are referenced in recommendations
Currently `PRODUCTOS RECOMENDADOS HOY` appears in the prompt but isn't explicitly linked to the recommendation moments. Add explicit instruction: "When recommending, prioritize products from PRODUCTOS RECOMENDADOS HOY."

## Files to change
- `supabase/functions/whatsapp-webhook/index.ts` — update `upsellBlock` generation in `buildDynamicPrompt` (lines 1355-1358)

## What is NOT touched
- Core prompt recommendation structure (lines 1020-1050) — already correct
- Override logic — unrelated
- Order flow — unrelated

