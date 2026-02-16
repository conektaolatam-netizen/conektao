
# Corregir el sistema de Message Batching para eliminar pedidos perdidos

## Problema identificado

El message batching actual tiene una race condition critica que causa que mensajes se "caigan" sin respuesta. En esta conversacion especifica:

- El cliente dijo el nombre ("Ibeth Barrera"), confirmo ("Si"), y esperó 22 minutos sin respuesta
- Alicia tenia TODA la informacion para cerrar el pedido: producto, direccion, metodo de pago, nombre
- El pedido se perdio completamente (order_status: "none", current_order: null)

### Causa tecnica

1. **Race condition en BATCH SKIP (linea 1879)**: Cuando "Ibeth" y "Barrera" llegan casi simultaneamente, el webhook de "Ibeth" hace SKIP esperando que "Barrera" lo maneje, pero "Barrera" falla silenciosamente
2. **Errores tragados (linea 1987-1992)**: El catch devuelve status 200 y solo loguea, sin reintentar ni alertar
3. **Check de dedup por contenido, no por ID**: Multiples "Si" pasan todos el check porque comparan texto, no mensaje ID
4. **Nudge system no rescato la conversacion**: A pesar del polling cada 120s, el sistema no reacciono a 9 mensajes sin respuesta

## Solucion propuesta

### Cambio 1: Reemplazar dedup por content con dedup por message ID

En lugar de comparar `lastCustomerMsg.content !== text`, usar el `message_id` de WhatsApp (que es unico por mensaje):

```text
Antes:  if (lastCustomerMsg.content !== text) → SKIP
Despues: if (lastCustomerMsg.wa_message_id !== currentMessageId) → SKIP
```

Esto garantiza que cada mensaje tiene un webhook responsable de procesarlo, sin importar si el texto es identico.

### Cambio 2: Agregar "safety net" - si SKIP falla, reintentar

Despues del BATCH SKIP, verificar en 5 segundos adicionales si hubo respuesta. Si no la hubo, procesar de todas formas:

```text
1. Webhook guarda mensaje, espera 3s
2. Re-lee conversacion
3. Si hay mensaje mas nuevo → SKIP (otro webhook lo maneja)
4. NUEVO: Esperar 5s mas y re-verificar
5. Si sigue sin respuesta de assistant → procesar de emergencia
```

### Cambio 3: Mejorar el error handling (linea 1987)

- Agregar logging detallado del error (stack trace completo)
- Si el error es durante `callAI()` o `sendWA()`, guardar un mensaje de fallback en la conversacion
- Enviar notificacion al admin cuando un mensaje falla en procesarse

### Cambio 4: Fortalecer el nudge system

Actualmente `check_nudges` busca conversaciones con `pending_since` o ciertos estados. Agregar una deteccion adicional:

- Si los ultimos N mensajes son todos del cliente (sin respuesta de assistant), marcar como "abandoned" y forzar un retry de procesamiento
- Esto actua como red de seguridad final para cualquier mensaje perdido

### Cambio 5: Guardar wa_message_id en cada mensaje

Modificar el objeto de mensaje guardado en el array `messages` para incluir el ID unico de WhatsApp:

```text
{ role: "customer", content: "Ibeth", timestamp: "...", wa_message_id: "wamid.xxx" }
```

Esto permite tracking preciso de que mensajes han sido procesados.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Corregir batching, agregar wa_message_id, safety net, mejor error handling |

## Resultado esperado

- Cero mensajes perdidos por race conditions
- Si un webhook falla, el safety net o el nudge system recuperan la conversacion
- Logging detallado para diagnosticar cualquier fallo futuro
- El pedido de Ibeth Barrera (y similares) se habria cerrado automaticamente
