Diagnóstico (causa raíz identificada)

1. La lógica nueva sí está funcionando en conversaciones nuevas

- Evidencia en DB: conversación `573161087806` (creada 2026-03-18 17:29) respondió en el primer mensaje con saludo + recomendación de producto.  
- Esto confirma que `suggestionFlow.ts` y el flujo inyectado en `whatsapp-webhook` están activos.

2. El problema real ocurre por contexto de conversación “contaminado” en números ya usados

- En `whatsapp-webhook/index.ts`, `callAI()` envía historial completo reciente: `msgs.slice(-120)`; además se guardan hasta 30 mensajes por conversación.  
- En conversaciones como `573506332222` y `573006653341`, el historial está lleno de ciclos `Hola` → mismo saludo literal.  
- El modelo termina copiando el último patrón del historial en vez de ejecutar de nuevo el “paso 1 con sugerencia”.

3. Regla de máximo sugerencias también contribuye

- `suggest_configs.max_suggestions_per_order = 1`.  
- En varias conversaciones ya hubo sugerencias antes (pasos 2/3), por lo que el modelo puede interpretar que ya alcanzó el máximo y evita sugerir de nuevo en saludos posteriores.

4. Estado conversacional no siempre se reinicia para “nuevo intento”

- Hay casos con `order_status = active` y `current_order` aún presente (ej. `573506332222`), lo cual empuja al modelo a continuar contexto viejo.  
- Aunque `order_status = none`, si el historial sigue largo/repetitivo, el sesgo de copia persiste.

Plan propuesto (sin tocar código aún)

A. Controlar reinicio de conversación por inactividad o saludo de reapertura  

- Si llega “hola/buenas” después de X minutos y no hay confirmación pendiente, resetear contexto operativo (y opcionalmente historial corto).

B. Evitar que “hola loops” dominen el prompt  

- Antes de `callAI`, comprimir/eliminar secuencias repetidas de saludo-respuesta para no sesgar salida.
- &nbsp;

C. Ajuste de reglas de sugerencia por ciclo de pedido  

- `max_suggestions_per_order`  no debe definir el maximo conteo por ciclo, en realidad el debe definir solo las maximas sugerencias por momento, ahora se utilizara `max_suggestions_per_moment`  en lugar de `max_suggestions_per_order`  , cambiar todas las logicas para tomar el nuevo nombre

D. Verificación  

- Probar con:  
  1. número nuevo,  
  2. número antiguo con historial largo,  
  3. conversación con pedido previo incompleto.
- Confirmar que en los tres casos el primer saludo del nuevo ciclo incluya producto recomendado.