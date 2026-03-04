

## Plan: Evitar que el fallback "Lo siento, no pude procesar tu mensaje" se envíe como nudge o sin contexto

### Problema

La frase `"Lo siento, no pude procesar tu mensaje. ¿Podrías repetirlo?"` es el fallback de `callAI()` (línea 1169). Se envía en dos situaciones incorrectas:

1. **Como nudge**: `runSalesNudgeCheck()` llama `callAI()` → si el AI gateway devuelve vacío, el fallback se envía al cliente sin que haya escrito nada.
2. **En cada webhook**: `runSalesNudgeCheck()` se ejecuta en línea 2061 **antes** de verificar si hay mensajes reales (línea 2066), así que status updates de Meta (delivered/read) también lo disparan.

### Cambios (3 puntos, mismo archivo)

**Archivo**: `supabase/functions/whatsapp-webhook/index.ts`

---

#### 1. Filtrar el fallback en nudges (línea ~1657-1665)

Después de `callAI` en el nudge, verificar que `cleanNudge` no contenga la frase de fallback. Si la contiene, no enviar el mensaje:

```typescript
const cleanNudge = nudgeMsg.replace(...).trim();

// NO enviar si es el fallback genérico
const FALLBACK_MSG = "Lo siento, no pude procesar tu mensaje";
if (!cleanNudge || cleanNudge.includes(FALLBACK_MSG)) continue;
```

Esto garantiza que si el AI falla durante un nudge, simplemente se salta esa conversación en vez de enviar el error al cliente.

---

#### 2. Mover `runSalesNudgeCheck()` después del filtro de mensajes (línea 2061 → después de 2066)

Actualmente se ejecuta antes de verificar si el webhook trae mensajes reales. Moverlo después del early return para que solo se ejecute cuando hay un mensaje real del usuario:

```text
// ANTES (línea 2061): runSalesNudgeCheck() antes del filtro
// DESPUÉS: moverlo después de la línea 2070 (después del return de "no messages")
```

Esto reduce dramáticamente la frecuencia de ejecución (solo con mensajes reales, no con status updates).

---

#### 3. Cambiar el fallback de `callAI` por `null` y manejar en cada caller (línea 1169)

En vez de retornar una frase confusa cuando el AI no responde, retornar `null`:

```typescript
return d.choices?.[0]?.message?.content || null;
```

Luego en el flujo principal (línea ~2720), si `callAI` retorna `null`, usar un mensaje genérico contextual:

```typescript
const ai = await callAI(sys, mergedMsgs);
if (!ai) {
  // No enviar nada si el AI falló — el usuario no recibe mensaje basura
  // Solo loguear el error
  console.error("AI returned empty response for", from);
  return new Response(JSON.stringify({ status: "ai_empty" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

Esto asegura que:
- Si el AI falla, el usuario **no recibe ningún mensaje** en vez de recibir "Lo siento, no pude procesar..."
- El fallback solo se envía si el usuario realmente escribió algo Y el AI no pudo generar respuesta — y en ese caso, se puede usar un mensaje más apropiado como "Dame un momento, estoy procesando tu solicitud 😊"

### Resumen de comportamiento después del fix

| Escenario | Antes | Después |
|-----------|-------|---------|
| AI vacío en nudge | Envía "Lo siento..." al cliente | No envía nada |
| Status update de Meta | Ejecuta nudge check | No ejecuta nudge check |
| AI vacío en mensaje real | Envía "Lo siento..." | No envía nada, solo loguea |
| AI falla con error HTTP | Throw (no envía) | Sin cambio |

### Archivos afectados
- `supabase/functions/whatsapp-webhook/index.ts` (3 cambios puntuales)

