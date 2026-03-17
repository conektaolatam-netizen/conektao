

# Plan: Sugerencias como pasos independientes en el flujo

## Cambios

### 1. `supabase/functions/_shared/suggestionFlow.ts`

Cambiar los fragmentos `step1`, `step2`, `step3` para que sean texto completo de paso (sin el prefijo `\n   →`):

- `step1`: `'Menciona naturalmente 1-2 productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"'`
- `step2`: Combina upsizing + complements en un solo string de paso
- `step3`: `'Antes de pasar a recoger/domicilio, haz UNA última sugerencia breve. Ej: "Antes de cerrar, ¿no te provoca un [producto]?"'`

Si disabled → siguen siendo `""`. Sin cambios en `globalRules`.

### 2. `buildCoreSystemPrompt` en ambos archivos

Reemplazar el bloque estático del flujo (líneas 64-72 en generate-alicia, 1033-1041 en webhook) con construcción dinámica por array:

```ts
const flowSteps = [
  "Saluda y pregunta qué quiere",
  sf.step1,
  "Anota cada producto",
  sf.step2,
  'Después de cada uno pregunta: "Algo más?"',
  sf.step3,
  'Cuando diga "no", "eso es todo", "nada más" → pregunta: recoger o domicilio',
  "Si domicilio → pide nombre y dirección. Si recoger → pide solo nombre",
  "Indica datos de pago",
  // paso 6 específico de cada archivo (diferente entre generate-alicia y webhook)
  "El sistema guarda el pedido y espera confirmación del cliente automáticamente",
].filter(Boolean);

const flowText = flowSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
```

Luego se interpola `${flowText}` donde antes estaba el bloque estático.

**Diferencia en paso 6**: `generate-alicia` usa el texto con resumen completo visible; `whatsapp-webhook` usa el texto con tag + resumen automático. Cada archivo inserta su versión propia en el array.

### 3. Archivos afectados

1. `supabase/functions/_shared/suggestionFlow.ts` — ajustar formato de step1/step2/step3
2. `supabase/functions/generate-alicia/index.ts` — flujo dinámico por array
3. `supabase/functions/whatsapp-webhook/index.ts` — flujo dinámico por array

### Resultado

- `enabled=true` → flujo tiene ~11 pasos numerados secuencialmente (con sugerencias como pasos propios)
- `enabled=false` → flujo tiene ~8 pasos (idéntico al original, sin huecos)
- Las referencias a "PASO 6" en TAG OBLIGATORIO se actualizarán al número dinámico correcto

