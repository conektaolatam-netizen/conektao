
Diagnóstico encontrado (sin modificar nada):

1) Causa raíz principal: `reservation_flow` NO está permitido en la DB  
- La tabla `whatsapp_conversations` tiene un CHECK activo:
  `whatsapp_conversations_order_status_check`
- Valores permitidos actuales:  
  `none, building, confirmed, sent, emailed, active, pending_confirmation, pending_button_confirmation, nudge_sent, followup_sent`
- `reservation_flow` no está en esa lista.

2) Efecto directo en runtime  
- El webhook intenta hacer:
  `update({ order_status: "reservation_flow" })`
- Ese update falla por constraint, pero el código no valida `error` en ese punto.
- Aun así imprime log “Reservation flow activated…”, dando falso positivo.

3) Evidencia consistente con tus síntomas  
- Logs: “Reservation flow activated…” aparece repetidamente para el mismo número.
- Si realmente persistiera, en el siguiente mensaje NO debería volver a “activar”.
- Conversación actual quedó en `order_status = none`, y el bot responde como flujo normal de pedidos (“no manejamos reservas…”), justo lo que estás viendo.

Plan de corrección (mínimo impacto, sin romper pedidos):

Paso 1 — Migración DB (obligatorio)
- Actualizar constraint `whatsapp_conversations_order_status_check` para incluir:
  - `reservation_flow`
- Mantener todos los demás estados intactos.

Paso 2 — Robustecer webhook al guardar estado
- En el bloque de activación de reserva, validar `error` del update.
- Si falla, loggear error explícito con causa (constraint/status inválido).

Paso 3 — Fallback defensivo en el mismo request
- Añadir flag local (`forceReservationMode`) cuando se detecta intención.
- Calcular modo así:
  `isReservationMode = forceReservationMode || currentFlowStatus === "reservation_flow"`
- Esto evita que un fallo puntual de persistencia rompa ese turno de conversación.

Paso 4 — Observabilidad mínima
- Log explícito antes de llamar AI con:
  - `currentFlowStatus`
  - `isReservationMode`
- Así se valida en logs si realmente entró al prompt de reserva.

Paso 5 — Verificación E2E
- Caso A: `enabled=false` → rechazo correcto (como hoy).
- Caso B: `enabled=true` + “quiero reservar mesa” → debe pedir personas/fecha/hora/nombre (no desviar a pedidos).
- Caso C: confirmar reserva → inserta en `reservations`, envía ICS por WhatsApp y correo restaurante.
- Caso D: pedido normal → flujo de pedidos sigue intacto.

Resultado esperado tras aplicar:
- El estado `reservation_flow` sí persistirá.
- El LLM recibirá consistentemente el modo de reserva.
- Dejará de “evadir” reservas cuando estén habilitadas.
