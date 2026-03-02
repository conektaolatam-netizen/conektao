

## Plan: Complete Automated Onboarding Flow

### Summary
Overhaul `/alicia/registro` to add NIT + business name fields and use the `register-user` edge function (which already skips email verification). Then restructure `/alicia/setup` into a new 7-step flow that includes WhatsApp instructions, Meta phone setup (manual bridge), Alicia configuration, AI menu upload, and prompt generation. No new routes needed — we enhance the existing two pages.

### Database Changes

**New table: `onboarding_sessions`**
```sql
CREATE TABLE public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  business_data JSONB DEFAULT '{}',
  whatsapp_number TEXT,
  meta_phone_id TEXT,
  meta_access_token TEXT,
  meta_verified BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON public.onboarding_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### File Changes

#### 1. `src/pages/AliciaRegisterPage.tsx` — Enhanced registration
- Add `business_name` and `nit` fields to the form
- Use `register-user` edge function (already creates confirmed accounts, no email verification)
- After successful registration + auto-login, navigate to `/alicia/setup`
- Pass `business_name`, `nit`, `whatsapp` as user metadata

#### 2. `src/pages/AliciaSetupPage.tsx` — Restructured 7-step wizard
Replace the current 7 setup steps with the new flow:

| Step | Label | Component | Persists to |
|------|-------|-----------|-------------|
| 1 | WhatsApp | `OnboardingStepWhatsApp` — Instructions screen + checkbox | `onboarding_sessions` |
| 2 | Meta | `OnboardingStepMeta` — Manual Phone Number ID + Access Token entry | `onboarding_sessions` + `whatsapp_configs` |
| 3 | Auto-Config | `OnboardingStepAutoConfig` — Loading animation → stores config → success | `whatsapp_configs` (verify_token, webhook_url) |
| 4 | Restaurante | `OnboardingStepConfig` — Type of food, city, hours, delivery, payments, min order, delivery time, special rules (combined questionnaire) | `whatsapp_configs` JSONB fields |
| 5 | Menú | `OnboardingStepMenu` — Reuses existing `MenuOnboardingUpload` + `MenuOnboardingReview` for AI extraction | `categories` + `products` |
| 6 | Personalidad | Existing `Step6Personality` (tone, escalation, custom rules) | `whatsapp_configs` |
| 7 | Crear Alicia | `OnboardingStepGenerate` — Calls `generate-alicia` → success screen | `whatsapp_configs.generated_system_prompt` |

#### 3. New step components in `src/components/alicia-onboarding/`

- **`OnboardingStepWhatsApp.tsx`** — Clear instructions (delete WhatsApp or use new SIM), confirmation checkbox required before "Continuar"
- **`OnboardingStepMeta.tsx`** — Input fields for Phone Number ID and Permanent Access Token (manual bridge until Embedded Signup is approved). Validates by calling Meta Graph API
- **`OnboardingStepAutoConfig.tsx`** — Animated loading screen that writes phone_number_id, access_token, generates verify_token, sets webhook_url to Supabase function URL. Shows success confirmation
- **`OnboardingStepConfig.tsx`** — Combined questionnaire: food type, city/neighborhood, delivery hours (open/close/prep), delivery zones + costs, payment methods, minimum order, estimated delivery time, special rules. All saved to `whatsapp_configs` JSONB fields
- **`OnboardingStepMenu.tsx`** — Wraps existing `MenuOnboardingUpload` + `MenuOnboardingReview` components. Multi-image upload → Gemini extraction → review/edit → save to DB
- **`OnboardingStepGenerate.tsx`** — "Crear mi Alicia" button → calls `generate-alicia` edge function → animated success: "Tu Alicia ya está lista y funcionando"

#### 4. Edge function: `supabase/functions/meta-phone-register/index.ts`
- Accepts `phone_number_id` and `access_token`
- Validates credentials by calling `GET https://graph.facebook.com/v22.0/{phone_number_id}` with the token
- Returns success/failure + phone display name
- Future: will handle Embedded Signup flow

#### 5. `supabase/config.toml` — Add meta-phone-register function entry

### What is NOT touched
- `whatsapp-webhook` (conversation logic, AI temperature)
- `generate-alicia` edge function (called as-is)
- `menu-onboarding-parse` edge function (called as-is)
- `/alicia/config` page
- `/alicia-dashboard` page
- Any existing webhook handling

### Registration flow detail
The `register-user` edge function already uses `email_confirm: true` in `createUser()`, meaning accounts are created pre-confirmed with no email verification. The registration page will call this function directly, then auto-login with `signInWithPassword`, and redirect to `/alicia/setup`. The restaurant + profile records are created by the edge function + the setup page's `loadOrCreateConfig`.

