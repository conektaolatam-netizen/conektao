

## Rediseno UX del Dashboard de Gerente de Sucursal

### Diagnostico actual

El dashboard tiene 4 secciones grandes apiladas verticalmente, lo que crea una pagina muy larga y dificil de escanear. Los problemas principales son:

1. **Todo es vertical y del mismo ancho** - no hay jerarquia visual entre secciones
2. **Los colores son monotonos** - todo cafe/beige se mezcla y nada destaca
3. **Las secciones de IA parecen tarjetas normales** - no transmiten que hay inteligencia artificial detras
4. **El fondo es muy pesado** - el beige oscuro (#F5EDE4) cansa la vista
5. **Demasiado scroll** - para ver todo hay que bajar mucho

### Propuesta de rediseno

#### 1. Fondo mas limpio y claro
- Cambiar de `#FDF8F3 / #F5EDE4` a un fondo casi blanco: `#FAFAF8` con un toque cremoso apenas perceptible
- Eliminar los blobs decorativos difuminados del fondo (son innecesarios y ensucian)

#### 2. Nueva organizacion del layout (menos scroll, mejor uso del espacio)

```text
+--------------------------------------------------+
|  Header: Sucursal Zona T       [En linea]        |
+--------------------------------------------------+
|                                                    |
|  [IA de Condiciones - Resumen del Dia]            |
|  Tarjeta oscura premium con glow sutil            |
|                                                    |
|  [Clima]  [Calendario]  [Noticias]  (3 columnas)  |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  [Programacion Semanal]        [Auditoria]        |
|  (60% del ancho)               (40% del ancho)    |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  [Conektao AI Chat]                               |
|  Ancho completo, aspecto futurista                |
|                                                    |
+--------------------------------------------------+
```

Cambios clave:
- **Programacion Semanal + Auditoria** pasan a compartir fila (grid 60/40) en lugar de estar apilados
- **Conektao AI Chat** va al final, ancho completo, como la herramienta de consulta que es
- Menos scroll total al aprovechar mejor el espacio horizontal

#### 3. Secciones de IA con estetica futurista

Para todo lo que sea "IA", aplicar un tratamiento visual diferenciado:

- **Tarjeta de resumen IA (Condiciones)**: Fondo oscuro (`#1a1a2e` o similar) con borde sutil que tiene un gradiente animado (turquesa → naranja, los colores Conektao). Texto blanco. Icono de Sparkles con glow.
- **Insight de IA en Horarios**: Borde con gradiente animado turquesa/naranja en lugar del borde plano actual
- **Conektao Chat**: Header con fondo oscuro y efecto de glow sutil. El icono del bot con un anillo de luz animado. El area de input con borde que hace un shimmer sutil.

Esto crea un contraste visual claro: "lo cafe/crema es la marca Crepes & Waffles, lo oscuro con glow es la IA Conektao".

#### 4. Mejoras de color en tarjetas regulares

- Tarjetas con fondo `white` puro en lugar de `bg-white` con borde beige pesado
- Bordes mas sutiles: `border-[#E8E4DE]` en lugar de `border-[#D4C4B0]`
- Sombras mas suaves y modernas: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Los badges de estado (trafico alto/medio/bajo) con colores mas vibrantes y legibles

#### 5. Header simplificado
- Reducir margen inferior del header
- Badge "En linea" mas compacto

### Archivos a modificar

1. **`BranchManagerDashboard.tsx`**: Nuevo layout (fondo claro, grid reorganizado, eliminar blobs)
2. **`ConditionsAIPanel.tsx`**: Tarjeta de resumen IA con estetica dark/futurista con borde animado
3. **`ConektaoChat.tsx`**: Header del chat con tratamiento futurista oscuro, glow en icono del bot
4. **`AuditPanel.tsx`**: Ajustar bordes y sombras a la nueva paleta mas limpia
5. **`StaffSchedulePanel.tsx`**: Ajustar bordes/sombras, insight de IA con borde gradiente animado

### Seccion tecnica

**Gradiente animado para IA** (CSS con Tailwind + framer-motion):
- Se usara un `div` envolvente con `background: conic-gradient(...)` animado para crear el efecto de borde brillante
- Colores del gradiente: `#00D4AA` (turquesa Conektao) → `#FF6B35` (naranja Conektao)
- La animacion rota el gradiente lentamente con `animate={{ rotate: 360 }}` en loop

**Nuevo fondo global**:
- `bg-[#FAFAF8]` como color base (casi blanco con calidez minima)
- Sin blobs decorativos

**Layout grid para horarios + auditoria**:
- `grid grid-cols-1 lg:grid-cols-5 gap-6`
- Horarios: `lg:col-span-3`
- Auditoria: `lg:col-span-2`

