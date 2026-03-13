
Objetivo: eliminar el fallo persistente en Alicia Vendedores cuando Gemini devuelve `content: null`, evitando respuestas técnicas repetidas y evitando que Alicia “retome” frases fuera de contexto.

Diagnóstico (con evidencia):
1) El bucle original mejoró parcialmente: ya no se guarda el fallback en `vendedores_mensajes` (confirmado en DB).
2) El problema actual sigue ocurriendo porque el gateway devuelve respuesta inválida:
- `finish_reason: "stop"` con `message.content: null` (logs actuales).
3) La protección de bucle quedó debilitada:
- `detectErrorLoop` hoy mira “últimos 2 assistant con problema técnico”, pero esos fallbacks ya no se guardan; por eso casi nunca activa reset.
4) Efecto visible en chat:
- tras fallback, el siguiente turno puede continuar una frase vieja (“Así ya quedas listo...”) en vez de responder la objeción (“¿Es pirámide?”).

Plan de implementación (solo backend de Alicia Vendedores):
1) Rehacer detección de loop sin depender de guardar fallbacks
- Mantener filtro de no guardar mensajes técnicos.
- Cambiar señal de loop a patrón de historial “cola con múltiples mensajes user consecutivos sin assistant válido entre medio” (síntoma real cuando hubo fallback técnico).
- Usar esta señal para activar modo recuperación.

2) Modo recuperación en el prompt (solo cuando se detecta señal de fallo previo)
- Inyectar una instrucción de alta prioridad antes del historial:
  “Hubo un fallo técnico reciente. Ignora continuidad incompleta y responde directamente al último mensaje del usuario”.
- Esto evita respuestas “colgadas” y fuerza foco en el último mensaje real.

3) Retry más robusto sin tocar estrategia comercial
- Mantener 1 retry.
- En el segundo intento, reforzar payload con instrucción explícita de responder al último mensaje del usuario (error-recovery only).
- Mantener validación estricta:
  - reply existe
  - es string
  - `trim().length > 0`
  - o hay `tool_calls`.

4) Fallback inteligente de recuperación (sin romper flow)
- Si falla AI tras 2 intentos:
  - si hay señal de loop: usar `RESET_MESSAGE`.
  - si no hay señal: fallback técnico actual.
- No guardar en DB ni fallback ni reset (se mantiene).

5) Guardrail para objeción crítica cuando AI cae (error-recovery only)
- Si el último mensaje contiene objeción tipo “pirámide/estafa/legal” y AI falló 2 veces, enviar respuesta segura predefinida alineada al prompt de objeciones.
- Esto reduce caída en justo el punto más sensible del embudo sin cambiar estrategia general.

6) Logging operacional adicional
- Registrar:
  - activación de “recovery mode”
  - patrón detectado de users consecutivos
  - fallback por objeción crítica
  - fallback/reset final usado
- Mantener logs existentes de retry/fallback.

Detalles técnicos:
- Archivo objetivo: `supabase/functions/whatsapp-vendedores/index.ts`.
- No tocar:
  - `sendWhatsAppMessage()`
  - webhook structure
  - tool `registrar_vendedor` y lógica de registro/código
  - esquemas/tablas.
- No tocar Alicia Restaurantes.

Validación posterior:
1) Reproducir conversación con objeción “¿Es una pirámide?”.
2) Verificar en logs que, si hay `content: null`, entra recovery mode y responde al último mensaje.
3) Confirmar que fallback/reset no se inserta en `vendedores_mensajes`.
4) Confirmar que no hay respuestas “arrastradas” del turno previo tras error.
