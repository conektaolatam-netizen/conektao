import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AliciaModule = 
  | 'dashboard'
  | 'marketplace'
  | 'facturacion'
  | 'caja'
  | 'inventario'
  | 'cocina'
  | 'documentos'
  | 'auditoria'
  | 'empleados'
  | 'productos'
  | 'configuracion'
  | 'unknown';

export type UserRole = 'owner' | 'admin' | 'cashier' | 'waiter' | 'kitchen' | 'employee';

export interface BusinessState {
  isCashOpen: boolean;
  pendingOrders: number;
  unsentCommands: number;
  criticalInventory: number;
  activeShift: boolean;
}

export interface AliciaContext {
  currentModule: AliciaModule;
  userRole: UserRole;
  businessState: BusinessState;
  isLoading: boolean;
}

// Map routes to modules
const routeToModule: Record<string, AliciaModule> = {
  '/dashboard': 'dashboard',
  '/pos': 'facturacion',
  '/billing': 'facturacion',
  '/cash': 'caja',
  '/inventory': 'inventario',
  '/kitchen': 'cocina',
  '/documents': 'documentos',
  '/audit': 'auditoria',
  '/employees': 'empleados',
  '/products': 'productos',
  '/marketplace': 'marketplace',
  '/supplier-marketplace': 'marketplace',
  '/settings': 'configuracion',
  '/profile': 'configuracion',
};

export function useAliciaContext(): AliciaContext {
  const location = useLocation();
  const { user, profile } = useAuth();

  // Detect current module from route
  const currentModule: AliciaModule = (() => {
    const path = location.pathname;
    for (const [route, module] of Object.entries(routeToModule)) {
      if (path.startsWith(route)) return module;
    }
    if (path === '/' || path === '/index') return 'dashboard';
    return 'unknown';
  })();

  // Fetch full profile with employee_type from Supabase
  const { data: fullProfile } = useQuery({
    queryKey: ['alicia-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('role, employee_type')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Map profile role to UserRole
  const userRole: UserRole = (() => {
    const role = fullProfile?.role || profile?.role;
    if (role === 'owner') return 'owner';
    if (role === 'admin') return 'admin';
    if (role === 'employee') {
      const empType = fullProfile?.employee_type;
      if (empType === 'cashier') return 'cashier';
      if (empType === 'waiter') return 'waiter';
      if (empType === 'kitchen') return 'kitchen';
      return 'employee';
    }
    return 'owner'; // Default
  })();

  // Fetch business state
  const { data: businessState, isLoading } = useQuery({
    queryKey: ['alicia-business-state', profile?.restaurant_id],
    queryFn: async () => {
      if (!profile?.restaurant_id) {
        return {
          isCashOpen: false,
          pendingOrders: 0,
          unsentCommands: 0,
          criticalInventory: 0,
          activeShift: false,
        };
      }

      const today = new Date().toISOString().split('T')[0];

      // Check cash register
      const { data: cashRegister } = await supabase
        .from('cash_registers')
        .select('id, is_closed')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('date', today)
        .maybeSingle();

      // Count pending kitchen orders
      const { count: pendingOrders } = await supabase
        .from('kitchen_orders')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', profile.restaurant_id)
        .in('status', ['pending', 'in_progress']);

      // Count critical inventory items
      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('current_stock, min_stock')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('is_active', true);

      const criticalInventory = ingredients?.filter(
        i => i.current_stock <= i.min_stock
      ).length || 0;

      return {
        isCashOpen: cashRegister ? !cashRegister.is_closed : false,
        pendingOrders: pendingOrders || 0,
        unsentCommands: 0, // This would need order tracking
        criticalInventory,
        activeShift: !!cashRegister,
      };
    },
    enabled: !!profile?.restaurant_id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  return {
    currentModule,
    userRole,
    businessState: businessState || {
      isCashOpen: false,
      pendingOrders: 0,
      unsentCommands: 0,
      criticalInventory: 0,
      activeShift: false,
    },
    isLoading,
  };
}
