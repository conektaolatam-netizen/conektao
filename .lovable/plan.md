

# Plan: Refactor System Prompt — Remove Redundancies

## Problem
The core system prompt has grown organically and now contains many rules that are either (a) duplicated within the prompt itself, or (b) enforced by backend interceptors, making the prompt instructions redundant. This wastes ~30% of tokens and causes "instruction dilution" (the LLM ignores rules buried in long prompts).

## Redundancy Analysis

### A. Rules said multiple times in the prompt (consolidate)
1. **"NUNCA inventes precios"** — appears in ANTI-ALUCINACIÓN (line 1071), again as "Solo usas precios de base de datos" (1079), and again in REGLAS INQUEBRANTABLES #1 (1188). **3x → 1x**
2. **"NUNCA inventes productos"** — appears in ANTI-ALUCINACIÓN (1070), "Solo usas productos de base de datos" (1078), and REGLAS INQUEBRANTABLES #3 (1190). **3x → 1x**
3. **"NUNCA cambies tamaños"** — ANTI-ALUCINACIÓN (1077) + REGLAS INQUEBRANTABLES #2 (1189). **2x → 1x**
4. **"NUNCA asumas que un pedido está listo"** — ANTI-ALUCINACIÓN (1074) + PROHIBIDO DECIR (1089). **2x → 1x**
5. **"NUNCA mientes"** — ANTI-ALUCINACIÓN (1083) is a vague catch-all already covered by the specific rules above. **Remove**
6. **TAG ---PEDIDO_CONFIRMADO--- placement** — explained in step 6 (1157), then repeated in TAG OBLIGATORIO (1161-1164), then repeated AGAIN as the last line of REGLAS INQUEBRANTABLES (1196). **3x → 1x**
7. **"NUNCA muestres JSON"** — REGLAS INQUEBRANTABLES #8 (1195) + reservation flow (1147). Keep only once.

### B. Rules now enforced by backend (safe to remove/simplify)
1. **Price validation** — `validateOrder()` corrects every price from DB before saving. The prompt rule "NUNCA inventes precios" is a nice-to-have but the backend guarantees correctness. **Keep 1 short line instead of 3.**
2. **Packaging rules** — The EMPAQUES section (1180-1185) is 5 lines. Backend `validateOrder()` recalculates packaging from DB. **Reduce to 1 line: "Incluye packaging_cost según datos del producto"**
3. **Confirmation anti-loop** — "Palabras afirmativas válidas" list (1171) is now handled by the backend's affirmative regex + payment proof keywords. The prompt version is still useful for the AI to understand what "confirmation" means, but the detailed list can be shortened.
4. **Anti-hallucinated confirmation** — "NUNCA digas que un pedido está listo" is now caught by the Layer 2 guardrail (line 4528). **Keep 1 short reminder instead of 3 separate warnings.**

### C. Vague/low-value rules (remove)
1. `"Siempre recalculas antes de confirmar"` (1082) — vague, the AI doesn't "recalculate"; the backend does.
2. `"NUNCA inventes estados de pedidos"` (1072) — the AI never sees order states; this is confusing.
3. `"No prometas tiempos si no están confirmados"` (1081) — already covered by TIEMPOS in business config.

## Changes

**File 1: `supabase/functions/whatsapp-webhook/index.ts`** — Refactor `buildCoreSystemPrompt()`

Replace the current ~140-line core prompt with a consolidated ~90-line version:

1. **IDENTIDAD** — keep as-is (6 lines, no redundancy)
2. **ANTI-ALUCINACIÓN** — consolidate from 15 lines to 7:
   - Merge product/price/size rules into single bullets
   - Remove "Solo usas productos/precios de base de datos" (duplicate)
   - Remove "NUNCA mientes" (catch-all)
   - Remove "Siempre recalculas" and "NUNCA inventes estados"
3. **PROHIBIDO DECIR** — merge into ANTI-ALUCINACIÓN as a sub-bullet (save the section header)
4. **TRATO AL CLIENTE** — keep as-is (essential, no backend enforcement)
5. **FORMATO** — keep as-is (essential, no backend enforcement)
6. **AUDIOS/STICKERS/CONTEXTO** — keep as-is
7. **FLUJO DE PEDIDO** — keep steps, but integrate the tag instruction into step 6 only (remove separate TAG OBLIGATORIO section and RECUERDA line)
8. **CONFIRMACIÓN** — keep but shorten the affirmative keywords list (backend handles this)
9. **MODIFICACIONES** — keep as-is (3 lines)
10. **EMPAQUES** — reduce from 5 lines to 1
11. **REGLAS INQUEBRANTABLES** — remove entirely; all 8 rules are already stated elsewhere in the consolidated prompt

**File 2: `supabase/functions/generate-alicia/index.ts`** — Sync `buildCoreSystemPrompt()`

Apply the same consolidated prompt structure. Since generate-alicia's version is simpler (no reservation mode), the sync is straightforward.

## Expected Result
- Prompt reduced by ~30-35% in token count
- Zero behavioral regression (all removed rules are either backend-enforced or consolidated)
- Better LLM attention to remaining rules (less dilution)
- Both files stay in sync

## What stays untouched
- `buildDynamicPrompt()` / `buildBusinessConfigPrompt()` — no changes
- `buildSuggestionFlow()` — no changes  
- `validateOrder()`, `saveOrder()`, all backend interceptors — no changes
- Reservation flow prompt — only dedup the "NUNCA muestres JSON" line

