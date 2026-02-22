

# Rediseno Premium UX - Alicia Dashboard

Cambio 100% visual. Cero logica modificada. Cero backend tocado.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/WhatsAppDashboard.tsx` | Fondo con profundidad, header premium con avatar Alicia, sidebar mejorado, chat bubbles estilizadas, barra info pedido, tabs premium |
| `src/components/alicia-setup/AliciaDailyChat.tsx` | Card glass premium con estilos coherentes |
| `src/components/alicia-dashboard/OrdersPanel.tsx` | Ajustes de border-radius, sombras y colores consistentes con el nuevo tema oscuro |
| `src/index.css` | Variables CSS nuevas para el tema premium del dashboard (si necesario) |

## Detalle de cambios

### 1. Fondo global con profundidad

Reemplazar `bg-background` en el contenedor principal por un fondo custom con base `#0B0F14` y dos radial-gradients sutiles:
- Turquesa (`rgba(20, 184, 166, 0.06)`) posicionado arriba-izquierda
- Naranja (`rgba(249, 115, 22, 0.04)`) posicionado abajo-derecha

Aplicado via `style` inline o clase CSS custom. Sin afectar legibilidad.

### 2. Tabs superiores premium

Redisenar el `TabsList` con fondo glass translucido (`bg-white/5 backdrop-blur-xl`), border sutil, y border-radius mayor. Los triggers activos con glow turquesa sutil.

### 3. Header de conversacion (Chat View)

Cuando hay conversacion seleccionada:
- Contenedor glass oscuro (`bg-white/5 backdrop-blur-md border border-white/10`)
- Avatar circular de Alicia (imagen de `@/assets/alicia-avatar.png`, 48px) con borde degradado turquesa-naranja y glow pulse sutil via CSS animation
- Nombre "ALICIA" con estado visual (punto de color segun `order_status`):
  - Verde = conversando/confirmado
  - Naranja = pendiente
  - Azul = follow-up
- Debajo: cliente, numero, boton bloquear con mejor spacing
- Sin cambiar comportamiento del boton

### 4. Chat bubbles premium

Solo cambios CSS:
- **Alicia (assistant)**: Degradado naranja suave (`from-orange-500/20 to-orange-600/10`), border sutil, sombra interna ligera, `rounded-2xl rounded-br-md`
- **Cliente**: Fondo glass (`bg-white/8 backdrop-blur-sm border border-white/10`), `rounded-2xl rounded-bl-md`
- Mejor spacing entre mensajes (gap-4)
- Timestamps con opacidad ajustada

### 5. Sidebar de conversaciones

- Fondo ligeramente mas claro que el main (`bg-white/3`)
- Conversacion activa con barra vertical turquesa (3px, glow) a la izquierda via `border-left` o pseudo-elemento
- Hover sutil (`hover:bg-white/5`)
- Mejor padding entre items
- Scroll minimal (scrollbar custom ya existe en el proyecto)

### 6. Ajustes del dia (AliciaDailyChat) - Card premium

- Fondo glass (`bg-white/5 backdrop-blur-md border border-white/10`)
- Icono con glow turquesa
- Boton enviar con degradado naranja (`bg-gradient-to-r from-orange-500 to-orange-600`)
- Input con border `border-white/10` y focus glow turquesa (`focus:ring-teal-500/30`)
- Override items con fondo `bg-white/5` en lugar de `bg-muted`

### 7. Barra informativa de pedido

El bloque `current_order` ya existe (lineas 427-456). Solo redisenar visualmente:
- Fondo glass oscuro en lugar de `bg-white`
- Border degradado sutil
- Total con color turquesa/naranja
- Labels mas limpios

### 8. Consistencia global

- Border-radius: `rounded-2xl` uniforme en cards, `rounded-xl` en items
- Sombras: `shadow-lg shadow-black/20` consistente
- Espaciado vertical uniforme
- Colores: palette turquesa (`teal-500`) + naranja (`orange-500`) con opacidades bajas

### 9. OrdersPanel ajustes menores

- Adaptar colores de fondo para que sean coherentes con el tema oscuro premium
- Los status badges ya usan colores correctos, solo ajustar opacidades si necesario

## Lo que NO se toca

- Ninguna llamada a Supabase
- Ningun edge function
- Ningun estado (useState, useEffect)
- Ningun handler (onClick, onKeyDown)
- Ningun calculo de totales/precios
- Ningun flujo de confirmacion/email/comanda
- Ningun webhook
- Ninguna dependencia nueva

## Seccion tecnica

Todos los cambios son `className` de Tailwind + algun `style` inline para gradients complejos. Se reutiliza el asset `@/assets/alicia-avatar.png` que ya existe. Las animaciones son CSS puro (keyframes ya existentes o animaciones Tailwind basicas como `animate-pulse`). No se agrega Framer Motion ni ninguna libreria al dashboard.

