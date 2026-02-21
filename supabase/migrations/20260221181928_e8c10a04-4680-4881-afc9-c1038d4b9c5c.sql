
-- Add column to store the generated final system prompt per business
ALTER TABLE public.whatsapp_configs
  ADD COLUMN IF NOT EXISTS generated_system_prompt text,
  ADD COLUMN IF NOT EXISTS prompt_generated_at timestamptz;

COMMENT ON COLUMN public.whatsapp_configs.generated_system_prompt IS 'Final AI system prompt = Core + Business Config, generated on demand';
COMMENT ON COLUMN public.whatsapp_configs.prompt_generated_at IS 'Timestamp of last prompt generation';
