import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useEmployeePermissions() {
  const { profile } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['employee-permissions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      
      // Owner has all permissions
      if (profile.role === 'owner') {
        return { _isOwner: true };
      }

      const { data, error } = await supabase
        .from('employee_permissions')
        .select('module_key, permission_key, allowed')
        .eq('employee_id', profile.id)
        .eq('allowed', true);

      if (error) {
        console.error('Error fetching permissions:', error);
        return {};
      }

      // Convert to structured format
      const permMap: Record<string, string[]> = {};
      data?.forEach(p => {
        if (!permMap[p.module_key]) {
          permMap[p.module_key] = [];
        }
        permMap[p.module_key].push(p.permission_key);
      });

      return permMap;
    },
    enabled: !!profile?.id
  });

  const hasPermission = (module: string, permission: string): boolean => {
    if (!permissions) return false;
    if ((permissions as any)._isOwner) return true;
    return permissions[module]?.includes(permission) || false;
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!permissions) return false;
    if ((permissions as any)._isOwner) return true;
    return !!permissions[module]?.length;
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasModuleAccess
  };
}
