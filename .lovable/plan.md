
# Mejora UX Mobile /alicia — Scroll Effects + Carga Instantánea del Avatar

## Objetivo
Hacer que la página `/alicia` en celular se sienta premium, fluida y moderna — estilo Apple. Sin cambiar orden ni contenido. Solo efectos visuales y velocidad de carga.

## Diagnóstico Actual

**Problemas detectados:**
1. **Avatar lenta en cargar**: La imagen se carga como `<img src="/lovable-uploads/...">` sin preload ni skeleton, así que el usuario ve el anillo gradient vacío por un momento antes de que aparezca la foto.
2. **Cero efectos de scroll**: Todos los elementos aparecen estáticos. No hay `IntersectionObserver`, no hay entrada animada al hacer scroll — los cards, pasos y beneficios simplemente están ahí desde el inicio.
3. **Mobile sin optimización de tacto**: Los botones y cards no tienen feedback háptico visual inmediato en mobile. Los `hover:` de CSS no funcionan en touch.

## Solución — 3 Capas de Mejoras

### Capa 1: Carga Instantánea del Avatar (Apple-style)

**En `AliciaHero.tsx`:**
- Agregar `loading="eager"` + `fetchPriority="high"` al `<img>` del avatar
- Mostrar un **skeleton shimmer** mientras carga, que hace `fade-out` suave cuando la imagen termina de cargar (con `onLoad` callback + estado `loaded`)
- El skeleton tiene el mismo gradiente naranja/turquesa que el borde, así se ve como si el avatar estuviera "materializándose"
- Añadir `decoding="async"` para no bloquear el render

```tsx
const [avatarLoaded, setAvatarLoaded] = useState(false);

// Skeleton con shimmer naranja/turquesa mientras carga
<div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${avatarLoaded ? 'opacity-0' : 'opacity-100'}`}
  style={{ background: 'linear-gradient(135deg, hsl(25 100% 50% / 0.3), hsl(174 100% 40% / 0.3))' }}>
  <div className="shimmer-apple" />
</div>

<img
  src="/lovable-uploads/c9d1c030-551a-4426-afb8-92aad9669c40.png"
  loading="eager"
  fetchPriority="high"
  decoding="async"
  onLoad={() => setAvatarLoaded(true)}
  className={`transition-opacity duration-700 ${avatarLoaded ? 'opacity-100' : 'opacity-0'} ...`}
/>
```

**Animación de entrada del avatar**: El avatar hace una entrada tipo Apple — empieza en `scale(0.85) opacity(0)` y hace `spring` a `scale(1) opacity(1)` en 600ms con `ease-out`. Se usa CSS puro (no framer-motion) para no añadir dependencias.

### Capa 2: Scroll Effects — `useScrollReveal` Hook Propio

Crear un hook `useScrollReveal` basado en `IntersectionObserver` que no agrega dependencias externas:

```tsx
// src/hooks/useScrollReveal.ts
export function useScrollReveal(options = {}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px', ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return { ref, isVisible };
}
```

### Capa 3: Efectos por Sección

**`AliciaHero`** — ya visible al cargar, no necesita scroll reveal. Solo mejora de avatar.

**`AliciaSteps`** — Cada card entra con:
- `translateY(40px) → 0` + `opacity(0) → 1`
- Delay escalonado: card 1 = 0ms, card 2 = 100ms, card 3 = 200ms, card 4 = 300ms
- En mobile: en vez de los 4 side-by-side, se apilan verticalmente y cada uno aparece al llegar al viewport

**`AliciaBenefits`** — Los 4 metric cards entran con efecto de "conteo" visual:
- Cada card hace `scale(0.9) blur(4px) → scale(1) blur(0)` al entrar
- El número grande (`+15%`, `100%`, `24/7`) hace una animación de "pop" separada con delay de 200ms después de que el card aparece
- En mobile (el glow `onMouseEnter/Leave` no funciona en touch): reemplazado por un `box-shadow` permanente suave que se activa con `isVisible`

**`AliciaDemoChat`** — El card del chat entra con:
- `translateY(60px) → 0` con `ease-out` 700ms
- El borde glow del chat hace `pulse` suave después de entrar (refuerza que "está vivo")

**`AliciaPlans`** — Los 2 cards de planes entran:
- Card izquierdo: entra desde `translateX(-30px)`
- Card derecho: entra desde `translateX(30px)`
- Simultáneo al llegar al viewport

**Sección Contacto y Footer** — Fade-in simple `opacity(0) → 1` con `translateY(20px) → 0`

### CSS Nuevo en `index.css`

```css
/* Shimmer Apple-style para avatar */
@keyframes shimmerApple {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer-apple {
  width: 100%; height: 100%; border-radius: 50%;
  background: linear-gradient(90deg, transparent 25%, hsl(25 100% 50% / 0.2) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmerApple 1.5s infinite;
}

/* Scroll reveal base */
.scroll-reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Variantes de entrada */
.scroll-reveal-left { transform: translateX(-30px) translateY(0); }
.scroll-reveal-left.visible { transform: translateX(0); }
.scroll-reveal-right { transform: translateX(30px) translateY(0); }
.scroll-reveal-right.visible { transform: translateX(0); }
.scroll-reveal-scale { transform: scale(0.9); filter: blur(4px); }
.scroll-reveal-scale.visible { transform: scale(1); filter: blur(0px); }

/* Delays para escalonado */
.reveal-delay-1 { transition-delay: 0ms; }
.reveal-delay-2 { transition-delay: 120ms; }
.reveal-delay-3 { transition-delay: 240ms; }
.reveal-delay-4 { transition-delay: 360ms; }
```

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/components/alicia-saas/AliciaHero.tsx` | Avatar eager load + skeleton shimmer + entrada animada |
| `src/components/alicia-saas/AliciaSteps.tsx` | Scroll reveal escalonado por card |
| `src/components/alicia-saas/AliciaBenefits.tsx` | Scroll reveal + pop en métricas + glow mobile-friendly |
| `src/components/alicia-saas/AliciaDemoChat.tsx` | Scroll reveal + glow pulse post-entrada |
| `src/components/alicia-saas/AliciaPlans.tsx` | Scroll reveal left/right |
| `src/pages/AliciaLanding.tsx` | Sección contacto + footer con reveal |
| `src/hooks/useScrollReveal.ts` | Hook nuevo (archivo nuevo, ~25 líneas) |
| `src/index.css` | Keyframes + clases CSS nuevas |

## Lo que NO cambia
- Orden de secciones
- Texto e información de cada sección
- Lógica del chat demo (AliciaDemoChat)
- Colores del design system
- El prompt de Alicia
- Flujo de pedidos
- Nada de backend
