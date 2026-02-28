

## Plan: Map Visual Enhancements + Node 2 Redesign

### Files to modify
1. **`src/components/vendedores/VendedorGameMap.tsx`** — background orbs, green completed nodes, rename Node 2, update `getPrevNodeName`
2. **`src/components/vendedores/nodes/NodePitchPerfecto.tsx`** — complete rewrite as "Convence en Poco Tiempo" with two-video sequential experience

### Change 1 — Background orbs (VendedorGameMap)
- Replace the 3 existing CSS orbs with 7 orbs: 4 orange `rgba(249,115,22,0.07)` + 3 turquoise `rgba(20,184,166,0.05)`
- Sizes range from 80px to 200px, `filter: blur(60px)`
- Each has a unique floating keyframe animation (20–30s loops, different directions)
- Positioned across the viewport so they feel scattered and alive

### Change 2 — Green completed nodes (VendedorGameMap)
- Completed node circle: `radial-gradient(circle at 40% 35%, #22C55E, #15803D)` with `boxShadow: "0 0 0 4px rgba(34,197,94,0.3), 0 0 20px rgba(34,197,94,0.35)"`
- Completed node label color: `#22C55E` instead of `#F97316`

### Change 3 — Rename Node 2 (VendedorGameMap)
- `NODE_META[1].label` → `"Convence en Poco Tiempo"`, subtitle → `"Dos técnicas para cerrar la venta"`
- Update `getPrevNodeName` references from `"El Pitch Perfecto"` to `"Convence en Poco Tiempo"`

### Change 4 — Node 2 content redesign (NodePitchPerfecto.tsx)
Complete rewrite with this structure:

**States:** `phase: "watching" | "complete"`, `video1Ended: boolean`, `video2Ended: boolean`, `scrolledToVideo2: boolean`

**Layout:**
- Title: "Convence en Poco Tiempo" + description text
- **Video 1 block**: orange small-caps label "PASO 1 — DESPIERTA SU INTERÉS", gray subtitle, 16:9 placeholder div with "Video próximamente" text, click-to-mark-complete behavior
- Divider: thin orange line with "Ahora el paso 2 👇" centered
- **Video 2 block** (ref for scroll target): orange small-caps label "PASO 2 — CIÉRRALO CON EL COMPUTADOR", gray subtitle, same 16:9 placeholder
- When Video 1 ends → smooth scroll to Video 2 ref, auto-start Video 2
- When Video 2 ends → show completion screen

**Completion screen:**
- Green checkmark animation (scale bounce)
- "¡Nivel completado!" heading
- XP progress bar animation (0→100%)
- CTA button: "¡Listo! Continuar →" with gradient `#F59E0B → #F97316`, padding `px-6`
- WhatsApp hint below in gray 13px

**Placeholder behavior:** Each video placeholder is a clickable div that marks itself as "ended" on tap, simulating video completion until real videos are added.

### Technical notes
- The orb CSS animations use `position: fixed` with `pointer-events: none` and `z-index: 0`
- Video placeholders maintain 16:9 aspect ratio via `aspect-video` Tailwind class
- `scrollIntoView({ behavior: 'smooth' })` for auto-scroll between videos
- No other files or components are touched

