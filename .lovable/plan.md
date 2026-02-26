

# Plan: Node 1 "Conoce a Alicia" — Audio + Synchronized Slides Experience

## Overview
Replace the current placeholder video in Node 1 with a fully interactive audio-driven slide presentation featuring ElevenLabs TTS narration, synchronized visual transitions, interactive pauses, subtitles, and a floating AI chat.

## Assets

1. **Copy uploaded images** to `src/assets/`:
   - `user-uploads://image-3.png` → `src/assets/whatsapp-logo.png`
   - `user-uploads://image-2.png` → `src/assets/gmail-logo.png`
   - Alicia photo: reuse existing `src/assets/alicia-avatar.png`

## Edge Functions (2 new)

### 1. `supabase/functions/alicia-tts-intro/index.ts`
- Calls ElevenLabs TTS API with the full Spanish script (hardcoded in the function)
- Uses `eleven_multilingual_v2` model, a female Spanish voice
- Returns binary MP3 audio
- Caches: generates once, returns the audio buffer directly
- Add to `config.toml` with `verify_jwt = false`

### 2. `supabase/functions/vendedor-chat/index.ts`
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`)
- System prompt: Alicia explaining herself to potential vendors — short answers (max 3 sentences), warm Colombian tone
- Covers: what she does, commissions, ticket promedio, WhatsApp integration, pricing
- Accepts `{ messages }`, returns `{ reply }`
- Add to `config.toml` with `verify_jwt = false`

## Component Architecture

### Rewrite: `src/components/vendedores/nodes/NodeConoceAlicia.tsx`
Complete rewrite — becomes a full-screen immersive experience with three layers:

**State:**
- `currentSlide` (0-5) — driven by audio timestamps
- `audioRef` — HTML Audio element reference
- `isPlaying` / `isPaused`
- `progress` (0-1) — audio progress for top bar
- `showInteractivePause` — pause card at 26s
- `showChat` — floating chat panel
- `chatMessages` — chat history
- `isAudioLoaded` / `isAudioLoading`

**Audio System:**
- Fetch MP3 from `alicia-tts-intro` edge function on mount
- `requestAnimationFrame` loop tracking `audio.currentTime` to:
  - Update progress bar
  - Trigger slide transitions at exact timestamps (0, 7, 16, 26, 38, 48s)
  - Auto-pause at 26s for interactive card
- Tap anywhere (except buttons) toggles play/pause

**Slide Definitions (data array):**
```
slides = [
  { start: 0, end: 7, subtitle: "Hola. Soy Alicia." },
  { start: 7, end: 16, subtitle: "Me conecto a tu WhatsApp" },
  { start: 16, end: 26, subtitle: "Subo el ticket promedio +15%" },
  { start: 26, end: 38, subtitle: "El pedido llega al correo automáticamente" },
  { start: 38, end: 48, subtitle: "Una herramienta. Tres resultados." },
  { start: 48, end: 999, subtitle: "" },
]
```

**Visual Components per slide:**
- **Slide 0:** Alicia photo (140px circle) + equalizer bars (5 animated orange bars) + name fade-in
- **Slide 1:** Alicia shrinks to 48px top-left, WhatsApp logo slides in, animated arrow (green SVG stroke-dashoffset), "Pedidos 24/7 ✓" pill
- **Slide 2:** Gold particle burst, "+15%" count-up animation (0→15 over 1.5s), subtitle
- **Interactive Pause at 26s:** Card slides up with "¿Sabes qué es el ticket promedio?" + two buttons (continue / open chat)
- **Slide 3:** WhatsApp logo → arrow animation → Gmail logo, envelope emoji flying along path
- **Slide 4:** Three stat cards pop in sequentially ("24/7", "+15%", "∞")
- **Slide 5:** Alicia returns center with gold glow, "Ya conoces a Alicia", then CTA button

**Fixed UI (always on top):**
- **Progress bar:** 2px top line, orange fill tracking audio position
- **Subtitles:** Bottom-center dark pill, 13px white text, auto-changes per slide
- **Chat button:** 52px orange circle bottom-right with pulsing dot

**Floating Chat Panel:**
- Slides up from bottom (65% height)
- Pauses audio on open, resumes on close
- Pre-loaded quick-reply chips: "¿Cómo gano dinero?" / "¿Qué hace exactamente?" / "¿Cuánto cuesta?"
- Calls `vendedor-chat` edge function
- Dark theme matching the experience

### Modify: `src/components/vendedores/NodeOverlay.tsx`
- Accept optional `fullScreen` prop
- When `fullScreen=true`: remove max-width container, padding, and scroll — render children as full viewport

### Modify: `src/components/vendedores/VendedorGameMap.tsx`
- Pass `fullScreen` prop when rendering Node 1

## CSS Additions (`src/index.css`)
- `@keyframes equalizerBar` — random height oscillation for 5 bars
- `@keyframes strokeDraw` — stroke-dashoffset for arrow animations
- `@keyframes countUp` — number increment
- `@keyframes envelopeFly` — envelope moving along arrow path

## Config
- Add both new edge functions to `supabase/config.toml`

## Technical Details

### ElevenLabs TTS Script (hardcoded in edge function)
Full Spanish script (~48 seconds of audio):
> "Hola. Soy Alicia. Trabajo para restaurantes en Colombia las 24 horas del día, los 7 días de la semana. Me conecto directamente al WhatsApp del restaurante. Ahí recibo pedidos, respondo preguntas y atiendo clientes, sin que el dueño tenga que hacer nada. Cada conversación que atiendo puede aumentar el valor de cada pedido hasta un quince por ciento. Eso significa más dinero para el restaurante, sin contratar a nadie. Y cuando el restaurante recibe un pedido, yo lo organizo y lo envío automáticamente al correo del dueño. Todo queda registrado, sin errores, sin papeles. Eso soy yo. Una sola herramienta que conecta WhatsApp con el correo del restaurante, aumenta las ventas y trabaja mientras el dueño duerme. Ahora ya me conoces. En el siguiente nivel vas a aprender exactamente cómo presentarme a un restaurante en menos de un minuto."

### Voice Selection
Use ElevenLabs voice **Laura** (`FGY2WhTYpPnrIDTdsKH5`) — female, multilingual, warm tone fitting for Colombian Spanish.

### Audio Caching
The TTS edge function generates the audio on each call. On the client side, we cache the audio blob URL in a `useRef` so replays don't re-fetch.

### Mobile UX
- All tap targets ≥ 44px
- `touch-action: manipulation` on interactive elements
- Responsive sizing with clamp() for text and elements

