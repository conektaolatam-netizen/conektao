-- Create settings_audit_log table for tracking all configuration changes
CREATE TABLE public.settings_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT,
    section TEXT NOT NULL, -- 'profile', 'restaurant', 'location', 'subscription', 'tips', 'security', 'targets'
    action TEXT NOT NULL, -- 'update', 'create', 'delete'
    before_json JSONB,
    after_json JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only restaurant owners and admins can view audit logs
CREATE POLICY "Owners and admins can view settings audit logs"
ON public.settings_audit_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.restaurant_id = settings_audit_log.restaurant_id
        AND p.role IN ('owner', 'admin')
    )
);

-- Policy: Authenticated users can insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
ON public.settings_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_settings_audit_log_restaurant_id ON public.settings_audit_log(restaurant_id);
CREATE INDEX idx_settings_audit_log_created_at ON public.settings_audit_log(created_at DESC);
CREATE INDEX idx_settings_audit_log_section ON public.settings_audit_log(section);