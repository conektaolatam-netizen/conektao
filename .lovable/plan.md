

## Humanizar a ALICIA: que parezca una persona real, no un bot

### Problema actual
ALICIA responde instantaneamente (parece robot), usa puntuacion perfecta, y tiene un tono demasiado "correcto" que delata que es una IA. Los clientes se dan cuenta y pierden confianza.

### Cambios propuestos

**1. Delay de respuesta simulando que escribe**

Agregar un retraso aleatorio de 2 a 6 segundos antes de enviar la respuesta de ALICIA. WhatsApp no muestra "escribiendo..." para cuentas Business API, pero el simple hecho de no responder en 0.5 segundos ya cambia la percepcion del cliente. Un humano tarda entre 3 y 8 segundos en leer y escribir una respuesta corta.

**2. Actualizar el prompt de ALICIA para ser mas natural**

Cambios concretos en las instrucciones del sistema:
- Prohibido llamarse "asistente virtual", "asistente" o "bot". Solo "Soy Alicia" o simplemente no decir que es
- No poner punto final en los mensajes (los humanos no lo hacen en WhatsApp)
- Usar minusculas casuales a veces ("dale", "listo", "va")
- Variaciones naturales: a veces no poner tildes perfectas, usar "q" en vez de "que" ocasionalmente, "x" en vez de "por" de vez en cuando
- No empezar siempre con el nombre del cliente
- Respuestas mas cortas: maximo 1-2 lineas la mayoria del tiempo
- Prohibido usar signos de exclamacion dobles o triples
- No repetir la misma estructura de mensaje (saludo + contenido + emoji)
- Usar "jaja" o "jeje" cuando sea apropiado, como lo haria una persona real

**3. Separar mensajes largos en multiples envios con delay entre ellos**

Si ALICIA necesita decir algo largo (como un resumen de pedido), dividirlo en 2-3 mensajes cortos con 1-2 segundos de delay entre cada uno, imitando como escribe una persona real que manda varios mensajes seguidos.

### Detalle tecnico

```text
Archivo: supabase/functions/whatsapp-webhook/index.ts

1. Nueva funcion "humanDelay(text)"
   - Calcula un delay basado en la longitud del texto
   - Mensajes cortos (< 50 chars): 2-3 segundos
   - Mensajes medianos (50-150 chars): 3-5 segundos  
   - Mensajes largos (> 150 chars): 4-6 segundos
   - Aplica el delay con un setTimeout/sleep antes de enviar

2. Modificar sendWA() para agregar delays entre chunks
   - Si hay multiples chunks, esperar 1.5-2.5 segundos entre cada uno

3. Actualizar buildPrompt() con reglas de humanizacion:
   - Bloque nuevo "REGLA #4 - PARECER HUMANA DE VERDAD"
   - Instrucciones explicitas sobre puntuacion, tono y estilo
   - Ejemplos de mensajes buenos vs malos

4. Subir temperature de 0.7 a 0.85 para respuestas mas variadas
```

### Resultado esperado

Antes: Cliente envia mensaje -> respuesta instantanea perfectamente redactada -> "esto es un bot"

Despues: Cliente envia mensaje -> 3-5 segundos de espera -> respuesta corta, natural, sin puntos finales -> "esto parece alguien real"

