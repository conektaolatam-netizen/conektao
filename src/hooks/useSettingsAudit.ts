import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type SettingsSection = 'profile' | 'restaurant' | 'location' | 'subscription' | 'tips' | 'security' | 'targets' | 'sales_goals' | 'documents' | 'payment_methods';

interface AuditLogParams {
  section: SettingsSection;
  action: 'update' | 'create' | 'delete' | 'password_change' | 'upload' | 'add' | 'set_active';
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export const useSettingsAudit = () => {
  const { user, profile, restaurant } = useAuth();

  const logSettingsChange = useCallback(async ({
    section,
    action,
    before,
    after,
  }: AuditLogParams): Promise<boolean> => {
    if (!user?.id || !restaurant?.id) {
      console.warn('Cannot log settings change: missing user or restaurant');
      return false;
    }

    // Only log if there are actual changes
    if (before && after && JSON.stringify(before) === JSON.stringify(after)) {
      console.log('No changes detected, skipping audit log');
      return true;
    }

    try {
      const { error } = await supabase
        .from('settings_audit_log')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          user_name: profile?.full_name || user.email || 'Usuario',
          section,
          action,
          before_json: before || null,
          after_json: after || null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });

      if (error) {
        console.error('Error logging settings change:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging settings change:', error);
      return false;
    }
  }, [user?.id, restaurant?.id, profile?.full_name, user?.email]);

  return { logSettingsChange };
};

export default useSettingsAudit;
