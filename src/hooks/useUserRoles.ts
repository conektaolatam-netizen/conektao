import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type AppRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'employee';

export interface UserRole {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  role: AppRole;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
}

export const useUserRoles = () => {
  const { user, profile, restaurant } = useAuth();
  const queryClient = useQueryClient();

  // Obtener roles del usuario actual
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data as UserRole[];
    },
    enabled: !!user?.id,
  });

  // Obtener todos los roles del restaurante (para owners/admins)
  const { data: restaurantRoles, isLoading: restaurantRolesLoading } = useQuery({
    queryKey: ['restaurant-roles', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('restaurant_id', restaurant.id);
      
      if (error) {
        console.error('Error fetching restaurant roles:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!restaurant?.id,
  });

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role: AppRole): boolean => {
    if (!userRoles) return false;
    return userRoles.some(r => r.role === role && r.is_active);
  };

  // Verificar si es dueño del restaurante
  const isOwner = (): boolean => {
    if (!restaurant || !user) return false;
    return restaurant.owner_id === user.id;
  };

  // Verificar si puede gestionar empleados
  const canManageEmployees = (): boolean => {
    return isOwner() || hasRole('admin') || hasRole('manager');
  };

  // Asignar rol a un usuario
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!restaurant?.id || !user?.id) throw new Error('No restaurant context');
      
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          restaurant_id: restaurant.id,
          role,
          assigned_by: user.id,
          is_active: true,
        }, {
          onConflict: 'user_id,restaurant_id,role',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-roles'] });
    },
  });

  // Remover rol de un usuario
  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!restaurant?.id) throw new Error('No restaurant context');
      
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('restaurant_id', restaurant.id)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-roles'] });
    },
  });

  return {
    userRoles,
    restaurantRoles,
    rolesLoading,
    restaurantRolesLoading,
    hasRole,
    isOwner,
    canManageEmployees,
    assignRole,
    removeRole,
  };
};
