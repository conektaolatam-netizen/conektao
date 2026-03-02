

## Plan: Automated Onboarding Flow for New Conektao Restaurant Clients

### Overview
Create a new `/alicia/onboarding` route with a 7-step wizard that takes a restaurant from zero to a fully configured, active Alicia — no manual Conektao team intervention. The existing `/alicia/registro`, `/alicia/setup`, and `/alicia/config` pages remain untouched.

Since Meta Tech Provider approval is pending, Steps 3-4 (phone registration) will build the full UI + edge function infrastructure but use a "manual entry" bridge until the Embedded Signup API is connected.

---

### Database Changes

**New table: `onboarding_sessions`** — tracks each restaurant's onboarding progress:
```sql
CREATE TABLE public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,
  business_data JSONB DEFAULT '{}',
  whatsapp_number TEXT,
  meta_phone_id TEXT,
  meta_verified BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}',
  menu_data JSONB DEFAULT '[]',
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
-- Users can only access their own sessions
CREATE POLICY "Users manage own onboarding" ON public.onboarding_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

Add `nit` column to `restaurants` if not present:
```sql
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS nit TEXT;
```

---

### New Files

#### 1. Page: `src/pages/AliciaOnboardingPage.tsx`
Master orchestrator with 7 steps, progress bar, and session persistence to `onboarding_sessions`. Each step save writes to Supabase before allowing progression.

**Steps:**
1. **Business Registration** — name, NIT, owner name, WhatsApp number
2. **WhatsApp Instructions** — explains they must use a clean number, confirmation checkbox
3. **Meta Phone Registration** — shows instructions to enter Phone Number ID and Access Token manually (infrastructure for future Embedded Signup). Input for 6-digit code (UI ready, currently manual bridge)
4. **Auto-Configuration** — loading screen that stores credentials in `whatsapp_configs`, generates verify_token, shows success
5. **Alicia Configuration** — restaurant type, city, hours, delivery zones/costs, payment methods, min order, delivery time, special rules
6. **Menu Upload + AI Extraction** — multi-image upload → calls existing `menu-onboarding-parse` edge function → review/edit screen → saves to `products` table
7. **Generate Alicia** — calls existing `generate-alicia` edge function → success screen "Tu Alicia ya está lista"

#### 2. Step Components: `src/components/alicia-onboarding/`
- `OnboardingStep1Business.tsx` — form: business_name, nit, owner_name, whatsapp_number
- `OnboardingStep2WhatsAppInstructions.tsx` — instruction screen + checkbox confirmation
- `OnboardingStep3MetaRegistration.tsx` — manual entry of Phone Number ID + Access Token (future: Embedded Signup popup). OTP input for Meta verification code (UI only for now)
- `OnboardingStep4AutoConfig.tsx` — animated loading → stores config → success confirmation
- `OnboardingStep5AliciaConfig.tsx` — questionnaire: food type, city, hours (open/close/prep start), delivery zones, payment methods, min order, delivery time, special rules
- `OnboardingStep6MenuUpload.tsx` — reuses existing `MenuOnboardingUpload` + `MenuOnboardingReview` components for image upload and AI extraction
- `OnboardingStep7Generate.tsx` — calls `generate-alicia`, shows animated success

#### 3. Edge Function: `supabase/functions/meta-phone-register/index.ts`
Stub edge function that will eventually handle Meta Embedded Signup flow. For now:
- Accepts phone_number_id, access_token from manual input
- Validates the credentials by calling Meta Graph API `GET /{phone_number_id}` with the token
- Returns success/failure
- Future: will handle `requestCode` → `verifyCode` flow

#### 4. Route: Add `/alicia/onboarding` to `App.tsx`

---

### Data Flow

```text
Step 1 → restaurants (name, nit, owner_id) + profiles (restaurant_id)
Step 2 → onboarding_sessions.current_step = 3
Step 3 → onboarding_sessions (meta_phone_id, whatsapp_number)
Step 4 → whatsapp_configs (phone_number_id, access_token, verify_token, webhook_url, order_email)
Step 5 → whatsapp_configs (operating_hours, delivery_config, payment_config, etc.)
Step 6 → categories + products tables (via existing MenuOnboardingFlow logic)
Step 7 → whatsapp_configs.generated_system_prompt (via generate-alicia function)
```

---

### What is NOT touched
- Existing Alicia conversation logic in `whatsapp-webhook`
- AI temperature settings
- Webhook handling code
- Existing `/alicia/registro`, `/alicia/setup`, `/alicia/config` pages
- `generate-alicia` edge function (called as-is)
- `menu-onboarding-parse` edge function (called as-is)

### Technical Notes
- The Meta Embedded Signup infrastructure is built but uses manual credential entry as a bridge
- All 7 steps validate inputs before proceeding
- Session is persisted at every step so users can resume if they leave
- Progress indicator shows step X of 7 with labels
- The flow creates the restaurant, profile link, and whatsapp_config records automatically
- Step 7 calls the existing `generate-alicia` function which builds the full system prompt and activates Alicia

