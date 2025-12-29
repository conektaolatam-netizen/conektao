-- =============================================
-- EMPLOYEE PERMISSIONS SYSTEM MIGRATION
-- =============================================

-- 1. Add salary columns to profiles if not exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS base_salary NUMERIC,
ADD COLUMN IF NOT EXISTS salary_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Create employee_permissions table (normalized)
CREATE TABLE IF NOT EXISTS employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  danger_confirmed_at TIMESTAMPTZ,
  danger_confirmed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, module_key, permission_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_emp_permissions_lookup 
ON employee_permissions(employee_id, module_key, permission_key);

CREATE INDEX IF NOT EXISTS idx_emp_permissions_restaurant 
ON employee_permissions(restaurant_id);

-- 3. Create role_presets table
CREATE TABLE IF NOT EXISTS role_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  preset_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, preset_key)
);

-- 4. Create employee_bonuses table
CREATE TABLE IF NOT EXISTS employee_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  formula JSONB,
  conditions JSONB,
  max_cap NUMERIC,
  is_active BOOLEAN DEFAULT true,
  configured_via_ai BOOLEAN DEFAULT false,
  ai_conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_bonuses_employee 
ON employee_bonuses(employee_id);

-- 5. Create resource_access table (granular product/category access)
CREATE TABLE IF NOT EXISTS resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_access_employee 
ON resource_access(employee_id, resource_type);

-- 6. Create has_permission function
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_module TEXT,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  
  -- Owner always has all permissions
  IF v_role = 'owner' THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM employee_permissions
    WHERE employee_id = p_user_id
      AND module_key = p_module
      AND permission_key = p_permission
      AND allowed = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Create apply_role_preset function
CREATE OR REPLACE FUNCTION apply_role_preset(
  p_employee_id UUID,
  p_preset_permissions JSONB,
  p_restaurant_id UUID
) RETURNS void AS $$
DECLARE
  v_module TEXT;
  v_permissions TEXT[];
  v_permission TEXT;
BEGIN
  -- Clear existing permissions for this employee
  DELETE FROM employee_permissions 
  WHERE employee_id = p_employee_id;
  
  -- Insert new permissions from preset
  FOR v_module IN SELECT jsonb_object_keys(p_preset_permissions)
  LOOP
    -- Get array of permissions for this module
    FOR v_permission IN SELECT jsonb_array_elements_text(p_preset_permissions -> v_module)
    LOOP
      INSERT INTO employee_permissions (restaurant_id, employee_id, module_key, permission_key, allowed)
      VALUES (p_restaurant_id, p_employee_id, v_module, v_permission, true)
      ON CONFLICT (employee_id, module_key, permission_key) 
      DO UPDATE SET allowed = true, updated_at = now();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable RLS on new tables
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_access ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for employee_permissions
CREATE POLICY "Owners and admins can manage permissions" ON employee_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.restaurant_id = employee_permissions.restaurant_id
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Employees can view their own permissions" ON employee_permissions
  FOR SELECT USING (employee_id = auth.uid());

-- 10. RLS Policies for role_presets
CREATE POLICY "Anyone in restaurant can view presets" ON role_presets
  FOR SELECT USING (
    restaurant_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.restaurant_id = role_presets.restaurant_id
    )
  );

CREATE POLICY "Owners can manage custom presets" ON role_presets
  FOR ALL USING (
    NOT is_system AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.restaurant_id = role_presets.restaurant_id
      AND p.role = 'owner'
    )
  );

-- 11. RLS Policies for employee_bonuses
CREATE POLICY "Owners and admins can manage bonuses" ON employee_bonuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.restaurant_id = employee_bonuses.restaurant_id
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Employees can view their own bonuses" ON employee_bonuses
  FOR SELECT USING (employee_id = auth.uid());

-- 12. RLS Policies for resource_access
CREATE POLICY "Owners and admins can manage resource access" ON resource_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.restaurant_id = resource_access.restaurant_id
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Employees can view their own resource access" ON resource_access
  FOR SELECT USING (employee_id = auth.uid());

-- 13. Trigger to update updated_at on employee_permissions
CREATE OR REPLACE FUNCTION update_employee_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_permissions_updated_at ON employee_permissions;
CREATE TRIGGER update_employee_permissions_updated_at
  BEFORE UPDATE ON employee_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_permissions_timestamp();

-- 14. Trigger for audit logging on permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (restaurant_id, table_name, action, record_id, new_values, user_id)
    VALUES (NEW.restaurant_id, 'employee_permissions', 'permission_granted', NEW.id, 
            jsonb_build_object('module', NEW.module_key, 'permission', NEW.permission_key, 'employee_id', NEW.employee_id),
            auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.allowed != NEW.allowed THEN
    INSERT INTO audit_logs (restaurant_id, table_name, action, record_id, old_values, new_values, user_id)
    VALUES (NEW.restaurant_id, 'employee_permissions', 
            CASE WHEN NEW.allowed THEN 'permission_granted' ELSE 'permission_revoked' END,
            NEW.id,
            jsonb_build_object('allowed', OLD.allowed),
            jsonb_build_object('allowed', NEW.allowed, 'module', NEW.module_key, 'permission', NEW.permission_key),
            auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (restaurant_id, table_name, action, record_id, old_values, user_id)
    VALUES (OLD.restaurant_id, 'employee_permissions', 'permission_deleted', OLD.id,
            jsonb_build_object('module', OLD.module_key, 'permission', OLD.permission_key, 'employee_id', OLD.employee_id),
            auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_employee_permissions ON employee_permissions;
CREATE TRIGGER audit_employee_permissions
  AFTER INSERT OR UPDATE OR DELETE ON employee_permissions
  FOR EACH ROW
  EXECUTE FUNCTION log_permission_change();