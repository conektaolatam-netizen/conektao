

# Plan: Mejorar el Cierre de Confirmacion de ALICIA

## Problema Actual
ALICIA a veces repite la pregunta de confirmacion, reenvia el resumen, o ignora respuestas afirmativas simples como "dale", "sisas", "hagale". Tambien la respuesta post-confirmacion no menciona que el pedido fue enviado a cocina.

## Cambios a Realizar

### 1. Actualizar el prompt de La Barra (lineas ~764-808)
- Cambiar la pregunta de confirmacion de "Todo bien con el pedido?" a: "Me confirmas tu pedido para empezarlo a preparar? Responde: 'Si, confirmar' o escribe que quieres cambiar."
- Agregar reglas anti-loop: PROHIBIDO repetir el resumen si ya se presento. PROHIBIDO preguntar confirmacion si order_status ya es pending_confirmation.
- Agregar lista explicita de palabras afirmativas colombianas: "sisas", "de una", "hagale", "va", "vamos", "hecho"
- Agregar regla: 1 sola pregunta por mensaje, mensajes cortos

### 2. Actualizar el prompt SaaS generico (lineas ~525-562)
- Mismos cambios que La Barra para consistencia

### 3. Actualizar las respuestas hardcodeadas de confirmacion (lineas ~1824-1829)
- Cambiar los mensajes aleatorios actuales por el formato especificado:
  - Incluir "Pedido confirmado"
  - Incluir "Ya lo estamos preparando"
  - Incluir "Pedido enviado a cocina"
  - Incluir instruccion de pago segun tipo (domicilio: pago al domiciliario, transferencia: pedir comprobante)
  - Preguntar si quiere agregar algo mas

### 4. Ampliar la deteccion de respuestas afirmativas (linea ~1805)
- Agregar: "sisas", "hagale", "hágale", "hecho", "eso es", emojis afirmativos en el regex

### 5. Agregar manejo de "quiero cambiar" en estado pending_confirmation
- Si el cliente dice que quiere cambiar algo, resetear order_status a "active" (no "none") y responder: "Listo, cuentame que quieres cambiar y lo ajusto."
- Actualmente solo detecta "no/cancel" como cancelacion, pero no detecta "cambiar/modificar/agregar" como intencion de edicion

## Detalles Tecnicos

### Archivos a modificar
- `supabase/functions/whatsapp-webhook/index.ts`

### Cambios especificos:
1. **Prompt La Barra** (~linea 770): Reemplazar frase de confirmacion y agregar reglas anti-loop
2. **Prompt SaaS** (~linea 531): Misma actualizacion
3. **Regex afirmativo** (~linea 1805): Agregar "sisas|hagale|hágale|hecho"
4. **Mensajes de confirmacion** (~linea 1824-1840): Reemplazar mensajes genericos por formato con info de pago y cocina
5. **Cancel patterns** (~linea 1853): Agregar deteccion de "cambiar|modificar|agregar|corregir" para redirigir en vez de cancelar
6. **Deploy** la edge function

### Lo que NO se toca:
- El flujo de toma de pedido (pasos 1-5) - ya funciona
- parseOrder() y la logica de tags - ya funciona
- saveOrder() y envio de email - ya funciona
- El sistema de nudges - ya funciona

