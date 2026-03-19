

# Plan: Corregir paso 3 — LLM sigue ofreciendo domicilio

## Diagnóstico

El prompt dinámico está correcto. Cuando `deliveryAvailable = false`, el paso 3 dice "indícale que el pedido es para recoger en el local". Sin embargo, el LLM sigue preguntando "¿Sería para recoger o para domicilio?" por dos causas:

1. **Historial de conversación**: Los mensajes anteriores del asistente (cuando domicilio estaba activo) contienen "¿Sería para recoger o para domicilio?". El LLM lee estos mensajes y replica el patrón, ignorando la instrucción del prompt.

2. **`suggestionFlow.ts` línea 73**: El texto de `sf.step3` dice "Antes de pasar a recoger/domicilio" — aunque NO se usa en la rama `false` del paso 3, sí se inyecta como parte de las reglas de sugerencia en la rama `true`. Si la config de sugerencias está activa, este texto aparece incluso cuando no debería.

## Cambios propuestos (2 archivos)

### 1. `supabase/functions/_shared/suggestionFlow.ts`

Hacer que `step3` sea consciente de si hay domicilio disponible. Cambiar la firma de `buildSuggestionFlow` para aceptar `deliveryAvailable?: boolean`. Cuando `deliveryAvailable = false`, el texto de `step3` debe decir "Antes de cerrar el pedido" en vez de "Antes de pasar a recoger/domicilio".

### 2. `supabase/functions/whatsapp-webhook/index.ts`

**Cambio A** — Pasar `deliveryAvailable` a `buildSuggestionFlow` dentro de `buildCoreSystemPrompt`, para que `sf.step3` no mencione domicilio cuando no aplica.

**Cambio B** — Agregar un bloque de limpieza de historial: cuando `deliveryAvailable = false`, inyectar un hint en el prompt que diga explícitamente:

```
IMPORTANTE: Ignora mensajes anteriores del historial donde se haya ofrecido domicilio. 
El servicio de domicilio NO está disponible. SOLO ofrece recogida.
```

Esto se insertaría en el `overridePromptBlock` o como sufijo al prompt, similar al patrón existente de `reopenHint`.

### 3. `supabase/functions/generate-alicia/index.ts`

Pasar `deliveryAvailable` a `buildSuggestionFlow` para consistencia.

## Lo que NO se modifica

- Lógica de pedidos / JSON
- Service overrides
- Validación de zonas
- Interceptación mid-conversation (ya funciona)
- Schema de base de datos

## Resultado

- El `sf.step3` no mencionará "domicilio" cuando no hay domicilio disponible
- El LLM recibirá instrucción explícita de ignorar mensajes previos sobre domicilio
- El paso 3 siempre dirá "para recoger en el local" cuando `deliveryAvailable = false`

