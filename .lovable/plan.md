

# Plan: Gamified Vendedores Redesign

## Database Changes

**Migration: Add columns to `vendedores` + create `vendedor_progress` table**

```sql
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS certificado boolean DEFAULT false;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS fecha_certificacion timestamptz;

CREATE TABLE IF NOT EXISTS vendedor_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid REFERENCES vendedores(id) ON DELETE CASCADE,
  nivel_completado integer NOT NULL CHECK (nivel_completado BETWEEN 1 AND 5),
  completed_at timestamptz DEFAULT now(),
  UNIQUE(vendedor_id, nivel_completado)
);

ALTER TABLE vendedor_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert vendedor_progress" ON vendedor_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select vendedor_progress" ON vendedor_progress FOR SELECT USING (true);
```

## New Dependency

- `html2canvas` — for certificate PNG download

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/VendedoresTraining.tsx` | Rewrite — add 3 phases: welcome → registration → game map |
| `src/components/vendedores/WelcomeScreen.tsx` | **Create** — Pantalla 0 with badge, social counter from Supabase |
| `src/components/vendedores/VendedorRegistration.tsx` | Modify — dark theme, save vendedor_id to localStorage |
| `src/components/vendedores/VendedorGameMap.tsx` | Rewrite — dark bg with particles, social counter, anticipation nodes, completion labels |
| `src/components/vendedores/NodeOverlay.tsx` | Modify — dark background theme |
| `src/components/vendedores/nodes/NodeConoceAlicia.tsx` | Rewrite — 3 micro-steps with flip cards and checkmarks |
| `src/components/vendedores/nodes/NodePitchPerfecto.tsx` | Rewrite — 3 micro-steps with script unlock |
| `src/components/vendedores/nodes/NodeVendeConData.tsx` | Rewrite — 3 micro-steps with flip-in stats |
| `src/components/vendedores/nodes/NodeCalculadora.tsx` | Modify — add confetti on positive ROI, micro-step confirmation |
| `src/components/vendedores/nodes/NodeComision.tsx` | Modify — add urgency element, micro-step |
| `src/components/vendedores/CompletionCelebration.tsx` | Rewrite — certificate card with user name, WhatsApp share, PNG download via html2canvas, update Supabase `certificado=true` |

## Architecture

### State Flow

```text
VendedoresTraining
├── phase: "welcome" | "register" | "game"
├── vendedorId: string (from Supabase insert, saved to localStorage)
├── vendedorName: string (saved to localStorage for certificate)
│
├── WelcomeScreen → counts vendedores from Supabase → CTA reveals registration
├── VendedorRegistration → saves to Supabase → returns vendedor_id + name
└── VendedorGameMap
    ├── fetches vendedor count for social counter
    ├── each node completion → INSERT vendedor_progress
    ├── progress keyed by vendedorId in localStorage
    └── on 100% → CompletionCelebration
        ├── certificate with dynamic name
        ├── html2canvas → download PNG
        ├── WhatsApp share link
        └── UPDATE vendedores SET certificado=true
```

### Micro-Victory Pattern (all nodes)

Each node will have internal `step` state (1 → 2 → 3). Each step shows a checkmark animation with CSS scale+color transition when completed. Final step triggers `onComplete` which fires XP bar animation on the map.

### Visual Design

- Dark backgrounds throughout (`bg-gray-950` / `bg-[#0a0a0a]`)
- Orange glow effects via CSS `box-shadow` and radial gradients
- Floating particles: CSS-only animation with `@keyframes float` on small orange dots
- No heavy animation libraries — all CSS transitions + framer-motion (already installed)
- Certificate: white card on dark bg, serif font for name, gold/orange border, Conektao branding

### Certificate Download

Using `html2canvas` to capture the certificate `div` as PNG. The certificate card will be a ref'd div with fixed dimensions for consistent output.

### Social Counter

Simple `supabase.from("vendedores").select("id", { count: "exact", head: true })` — returns count without loading all rows.

### localStorage Keys

- `vendedor_registered` → `"true"` (existing)
- `vendedor_id` → UUID from Supabase insert
- `vendedor_name` → name for certificate
- `vendedor_progress` → `[1,2,3...]` completed node IDs (existing, kept)

