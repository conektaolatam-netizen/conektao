

# Plan: Forzar instrucción de no-domicilio siempre (no solo con historial stale)

## Diagnóstico

El código está técnicamente correcto: el paso 3 dice "solo recoger" y hay un hint de historial. Pero el LLM ignora ambos porque:

1. **El hint solo se inyecta si detecta historial stale** (línea 3596-3602). Si por algún motivo el regex no matchea, no se inyecta.
2. **El hint va al final del prompt** (después de un prompt de miles de caracteres), donde tiene menos peso para el LLM.
3. **La conversación tiene mensajes previos del asistente diciendo "recoger o domicilio"**, y el LLM replica ese patrón por inercia.

## Cambio (1 archivo)

### `supabase/functions/whatsapp-webhook/index.ts`

**Cambio A — Inyectar hint SIEMPRE cuando `deliveryAvailable = false`** (líneas ~3593-3602)

Actualmente:
```
} else {
  // Delivery NOT available — inject hint to override stale history
  const recentMsgs = ...
  const hasStaleDeliveryOffer = recentMsgs.some(...)
  if (hasStaleDeliveryOffer) {
    reopenHint += "\n\nIMPORTANTE: Ignora mensajes anteriores..."
  }
}
```

Cambiar a: inyectar el hint **siempre** que `deliveryAvailable = false`, sin condicionar al historial:
```
} else {
  // Delivery NOT available — ALWAYS inject strong instruction
  reopenHint += "\n\nIMPORTANTE: El servicio de domicilio NO está disponible. 
  SOLO ofrece recogida en el local. NO preguntes 'recoger o domicilio'. 
  NO menciones domicilio como opción bajo ninguna circunstancia. 
  Ignora cualquier mensaje anterior donde se haya ofrecido domicilio.";
}
```

Esto garantiza que el hint siempre esté presente, independientemente de si el regex detecta historial stale o no.

**Cambio B — Mover instrucción de no-domicilio MÁS ARRIBA en el prompt** (línea ~1107)

Agregar un bloque justo antes de "FLUJO DE PEDIDO" en `buildCoreSystemPrompt` cuando `deliveryAvailable = false`:

```
${!deliveryAvailable ? "DOMICILIO NO DISPONIBLE: NO ofrezcas domicilio. SOLO recogida en el local. NUNCA preguntes 'recoger o domicilio'.\n" : ""}
```

Esto pone la instrucción en la parte más relevante del prompt (justo antes del flujo), no solo al final.

## Lo que NO se modifica

- Lógica de pedidos / JSON / service overrides
- Interceptación mid-conversation (ya funciona)
- `suggestionFlow.ts` (ya está correcto)
- `generate-alicia/index.ts`
- Schema de base de datos

## Resultado

- La instrucción de no-domicilio aparecerá en DOS lugares del prompt: antes del flujo + al final como hint
- Se inyectará SIEMPRE cuando no hay domicilio, no solo cuando hay historial stale
- El LLM tendrá mucho más difícil ignorar la instrucción

