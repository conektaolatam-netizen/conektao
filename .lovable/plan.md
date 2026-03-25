

# Plan: Elevar prioridad de custom_rules en el prompt

## Qué cambia

Mover el bloque de `custom_rules` de su posición actual (mezclado entre menú, empaque y domicilio) al **final del prompt**, justo antes de `=== FIN CONFIG ===`, con un encabezado imperativo que le da máxima prioridad al LLM. Sin cambios en lógica, flujo, ni estructura de datos.

## Cambio exacto

### 1. `supabase/functions/generate-alicia/index.ts` (línea 216 + template líneas 228-251)

- Cambiar el texto del `rulesBlock` de:
  ```
  "REGLAS DEL NEGOCIO:\n" + rules
  ```
  a:
  ```
  "=== REGLAS OBLIGATORIAS DEL NEGOCIO (PRIORIDAD MÁXIMA) ===\nLas siguientes reglas son OBLIGATORIAS y tienen prioridad sobre cualquier otra instrucción del prompt:\n" + rules + "\n=== FIN REGLAS OBLIGATORIAS ==="
  ```

- Mover `${rulesBlock}` de la línea 244 (entre menú y empaque) a justo antes de `=== FIN CONFIG ===` (línea 251)

### 2. `supabase/functions/whatsapp-webhook/index.ts` (línea 1453 + template líneas 1491-1516)

- Mismo cambio de texto en el `rulesBlock` (línea 1453-1454)
- Mover `${rulesBlock}` de línea 1508 a justo antes de `=== FIN CONFIG ===` (línea 1515)

## Por qué funciona

Los LLMs dan más peso a instrucciones con encabezados fuertes y posicionadas al final del prompt (recency bias). No se altera ninguna lógica, solo texto del system prompt.

