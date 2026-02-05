

## Plan: Mejorar UX del Resumen Ejecutivo de Auditoría

### Problema Identificado
El texto del resumen ejecutivo llega de la IA todo junto, sin separación visual. Esto ocurre porque:
1. El prompt de la IA no exige saltos de línea claros
2. El componente muestra el texto en un `<p>` que ignora los saltos de línea

### Solución

#### 1. Actualizar el Prompt de la IA (Edge Function)
Modificar `supabase/functions/crepes-branch-audit/index.ts` para que el prompt exija:
- Estructura con bloques separados por líneas vacías
- Formato visual claro: estado, prioridades, acciones
- Emojis al inicio de cada sección

Nuevo formato esperado:
```
📊 Estado: La sucursal opera al 81%, nivel aceptable pero con áreas críticas.

🎯 Prioridad 1: Mejorar puntualidad del personal
El equipo llega 12 min tarde en promedio. Supervisar entrada del turno mañana.

🎯 Prioridad 2: Impulsar productos con baja rotación  
Crepe de Pollo (-33%) y Helado de Pistacho (-47%) necesitan promoción hoy.

✅ Acción inmediata: Reunión de 5 min con meseras para impulsar estos 2 productos.
```

#### 2. Actualizar el Componente React
Modificar `src/components/crepes-demo/audit/AuditPanel.tsx`:
- Usar `whitespace-pre-line` en CSS para respetar saltos de línea
- Agregar padding y espaciado adecuado
- Dividir el texto en bloques visuales si tiene `\n\n`

### Cambios Técnicos

**Archivo 1:** `supabase/functions/crepes-branch-audit/index.ts`
- Actualizar `summaryPrompt` con instrucciones claras de formato:
  - Usar `\n\n` entre secciones
  - Estructura: Estado → Prioridad 1 → Prioridad 2 → Acción
  - Emojis obligatorios al inicio de cada bloque

**Archivo 2:** `src/components/crepes-demo/audit/AuditPanel.tsx`
- Cambiar el contenedor del resumen para usar `whitespace-pre-line`
- O dividir el texto por `\n\n` y mostrar cada bloque en su propia card/sección

### Resultado Esperado
El resumen se verá estructurado, con cada punto en su propio bloque visual, fácil de leer de un vistazo.

