

# Diagnóstico: Por qué el bot sigue usando solo el saludo literal

## Causa raíz identificada

El cambio anterior SÍ inyecta correctamente el greeting + instrucción de productos en el paso 1 del flujo. El prompt generado queda así:

```text
1. Saluda y pregunta qué quiere 
   → Usa como base este saludo: "¡Hola! 👋 Soy ALICIA, la asistente virtual 
   de La Barra Crea Tu Pizza en Ibagué. ¿En qué te puedo ayudar?". 
   Personalízalo y ,debes mencionar naturalmente hasta 1 productos populares...
```

**El modelo interpreta el texto entre comillas como el saludo a copiar**, ignorando la instrucción que viene después. Razones:

1. **El greeting es autocontenido**: Ya incluye presentación + pregunta ("¿En qué te puedo ayudar?"), así que el modelo no siente necesidad de agregar nada más.
2. **Instrucción débil después de comillas**: "Personalízalo y ,debes mencionar..." queda como nota secundaria (además tiene error sintáctico: coma extra).
3. **Gemini 2.5 Flash con temperature 0.2** favorece lo concreto (texto entre comillas) sobre lo abstracto (instrucciones).

## Solución propuesta

Cambiar la estrategia en `suggestionFlow.ts` — en lugar de poner el greeting textual entre comillas (que el modelo copia), **descomponer** el greeting en instrucciones de tono y obligar la mención de productos como parte inseparable del paso:

### Cambio en `suggestionFlow.ts`, step1 (cuando `suggest_on_greeting` es true):

**Antes:**
```typescript
step1 = `\n   → Usa como base este saludo: "${greetingMessage}". Personalízalo y ,debes mencionar naturalmente hasta ${maxSug} productos...`;
```

**Después:**
```typescript
step1 = `\n   → OBLIGATORIO en tu primer mensaje: (a) Saluda con el tono de "${greetingMessage}" pero NO lo copies textualmente, (b) Menciona hasta ${maxSug} producto(s) del menú recomendado(s). Tu saludo DEBE incluir nombre(s) de producto(s). Ej: "Hola! Hoy te recomiendo [producto del menú]. ¿Qué se te antoja?"`;
```

Esto hace tres cosas:
- Cambia "usa como base" (débil) por "OBLIGATORIO" con sub-pasos claros (a) y (b)
- Dice explícitamente "NO lo copies textualmente"
- Dice "Tu saludo DEBE incluir nombre(s) de producto(s)" — sin esto, no se genera producto

### Cambio para cuando `suggest_on_greeting` es false pero hay greeting:

**Antes:**
```typescript
step1 = `\n   → Usa como base este saludo: "${greetingMessage}". Personalízalo naturalmente`;
```

**Después:**
```typescript
step1 = `\n   → Saluda con el tono de: "${greetingMessage}" (NO copies textualmente, personalízalo)`;
```

### Corrección menor
- Arreglar la coma extra en `,debes` → `debes`

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/suggestionFlow.ts` | Reescribir step1 con instrucciones más directivas que eviten copia textual del greeting |

No se toca el webhook, el problema está exclusivamente en cómo `suggestionFlow.ts` formula la instrucción del step1.

