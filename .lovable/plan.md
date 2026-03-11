

## Plan: Corregir signos de interrogación cortados y faltantes

### Cambio 1: Mejorar `splitIntoHumanChunks()` para no cortar preguntas

Después de dividir el texto en chunks, verificar si un chunk empieza con `?` o `!`. Si es así, mover ese carácter al final del chunk anterior:

```typescript
function splitIntoHumanChunks(text: string): string[] {
  if (text.length <= 200) return [text];
  const parts = text.split(/\n\n+/).filter((p) => p.trim());
  if (parts.length >= 2 && parts.length <= 4) {
    return fixOrphanedPunctuation(parts.map((p) => p.trim()));
  }
  const lines = text.split(/\n/).filter((p) => p.trim());
  if (lines.length >= 2) {
    const mid = Math.ceil(lines.length / 2);
    const chunks = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")].filter((p) => p.trim());
    return fixOrphanedPunctuation(chunks);
  }
  return [text];
}

function fixOrphanedPunctuation(chunks: string[]): string[] {
  for (let i = 1; i < chunks.length; i++) {
    // If chunk starts with ? or ! (with optional spaces), move it to previous chunk
    const match = chunks[i].match(/^(\s*[?!¡¿]+\s*)/);
    if (match) {
      chunks[i - 1] = chunks[i - 1].trimEnd() + match[1].trim();
      chunks[i] = chunks[i].substring(match[0].length).trim();
    }
  }
  return chunks.filter((c) => c.length > 0);
}
```

### Cambio 2: Agregar regla de puntuación al Core Prompt (línea 647)

Añadir instrucción explícita sobre signos de interrogación en español:

```
ANTES (línea 647):
"Primera letra MAYÚSCULA siempre. NO punto final. Mensajes CORTOS..."

DESPUÉS:
"Primera letra MAYÚSCULA siempre. NO punto final. Siempre cierra los signos de interrogación (¿...?) y exclamación (¡...!). Mensajes CORTOS..."
```

### Cambio 3: Aplicar la misma lógica al corte por 4000 chars (líneas 286-298)

Después de cortar un segmento largo, verificar si el `rem` (resto) empieza con `?` o `!` y moverlo al segmento anterior.

### Archivos afectados
- `supabase/functions/whatsapp-webhook/index.ts` (3 cambios puntuales, mismas funciones)

