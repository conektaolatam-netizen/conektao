import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Types based on database schema
export interface GasPlant {
  id: string;
  tenant_id: string;
  name: string;
  location_text: string | null;
  capacity_value: number | null;
  capacity_unit: string;
  is_active: boolean;
  created_at: string;
}

export interface GasVehicle {
  id: string;
  tenant_id: string;
  plate: string;
  capacity_value: number;
  capacity_unit: string;
  driver_name: string | null;
  driver_phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GasClient {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  email: string | null;
  address: string;
  city: string | null;
  client_type: 'contract' | 'free';
  status: 'active' | 'restricted' | 'blocked';
  notes: string | null;
  created_at: string;
}

export interface GasRoute {
  id: string;
  tenant_id: string;
  route_number: string;
  plant_id: string | null;
  vehicle_id: string | null;
  driver_user_id: string | null;
  status: 'planned' | 'in_progress' | 'pending_return_review' | 'closed' | 'alert' | 'cancelled';
  planned_date: string;
  started_at: string | null;
  closed_at: string | null;
  assigned_qty: number | null;
  assigned_unit: string;
  expected_return_qty: number | null;
  actual_return_qty: number | null;
  notes: string | null;
  created_at: string;
  // Relations
  vehicle?: GasVehicle;
  plant?: GasPlant;
}

export interface GasDelivery {
  id: string;
  tenant_id: string;
  route_id: string;
  client_id: string;
  delivery_order: number;
  planned_qty: number;
  delivered_qty: number | null;
  unit: string;
  unit_price: number | null;
  total_amount: number | null;
  status: 'pending' | 'delivered' | 'partial' | 'not_delivered' | 'incident';
  receiver_name: string | null;
  delivered_at: string | null;
  incident_reason: string | null;
  created_at: string;
  // Relations
  client?: GasClient;
}

export interface GasAnomaly {
  id: string;
  tenant_id: string;
  anomaly_type: string;
  route_id: string | null;
  delivery_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_review' | 'resolved' | 'dismissed';
  title: string;
  description: string | null;
  created_at: string;
}

export interface GasInventorySummary {
  total_in_plant: number;
  total_in_vehicles: number;
  total_delivered_today: number;
  unit: string;
}

// Hook for GAS data operations
export const useGasData = () => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = restaurant?.id;

  // Plants
  const plantsQuery = useQuery({
    queryKey: ['gas_plants', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('gas_plants')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as GasPlant[];
    },
    enabled: !!tenantId,
  });

  // Vehicles
  const vehiclesQuery = useQuery({
    queryKey: ['gas_vehicles', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('gas_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('plate');
      if (error) throw error;
      return data as GasVehicle[];
    },
    enabled: !!tenantId,
  });

  // Clients
  const clientsQuery = useQuery({
    queryKey: ['gas_clients', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('gas_clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return data as GasClient[];
    },
    enabled: !!tenantId,
  });

  // Active Routes (today or in progress)
  const activeRoutesQuery = useQuery({
    queryKey: ['gas_routes_active', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('gas_routes')
        .select(`
          *,
          vehicle:gas_vehicles(*),
          plant:gas_plants(*)
        `)
        .eq('tenant_id', tenantId)
        .or(`planned_date.eq.${today},status.in.(planned,in_progress,pending_return_review)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GasRoute[];
    },
    enabled: !!tenantId,
  });

  // Driver's assigned route
  const myRouteQuery = useQuery({
    queryKey: ['gas_my_route', tenantId, user?.id],
    queryFn: async () => {
      if (!tenantId || !user?.id) return null;
      const { data, error } = await supabase
        .from('gas_routes')
        .select(`
          *,
          vehicle:gas_vehicles(*),
          plant:gas_plants(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('driver_user_id', user.id)
        .in('status', ['planned', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as GasRoute | null;
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Deliveries for a route
  const useRouteDeliveries = (routeId: string | null) => {
    return useQuery({
      queryKey: ['gas_deliveries', routeId],
      queryFn: async () => {
        if (!routeId) return [];
        const { data, error } = await supabase
          .from('gas_deliveries')
          .select(`
            *,
            client:gas_clients(*)
          `)
          .eq('route_id', routeId)
          .order('delivery_order');
        if (error) throw error;
        return data as GasDelivery[];
      },
      enabled: !!routeId,
    });
  };

  // Anomalies
  const anomaliesQuery = useQuery({
    queryKey: ['gas_anomalies', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('gas_anomalies')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['new', 'in_review'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as GasAnomaly[];
    },
    enabled: !!tenantId,
  });

  // Inventory summary
  const inventorySummaryQuery = useQuery({
    queryKey: ['gas_inventory_summary', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      // Get inventory in plants
      const { data: plantInventory, error: plantError } = await supabase
        .from('gas_inventory_ledger')
        .select('qty, unit')
        .eq('tenant_id', tenantId)
        .not('plant_id', 'is', null)
        .is('vehicle_id', null);
      
      if (plantError) throw plantError;

      // Get inventory in vehicles
      const { data: vehicleInventory, error: vehicleError } = await supabase
        .from('gas_inventory_ledger')
        .select('qty, unit')
        .eq('tenant_id', tenantId)
        .not('vehicle_id', 'is', null);
      
      if (vehicleError) throw vehicleError;

      // Get today's deliveries
      const today = new Date().toISOString().split('T')[0];
      const { data: todayDeliveries, error: deliveryError } = await supabase
        .from('gas_deliveries')
        .select('delivered_qty, unit')
        .eq('tenant_id', tenantId)
        .eq('status', 'delivered')
        .gte('delivered_at', `${today}T00:00:00`)
        .lte('delivered_at', `${today}T23:59:59`);
      
      if (deliveryError) throw deliveryError;

      const totalPlant = plantInventory?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
      const totalVehicles = vehicleInventory?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
      const totalDelivered = todayDeliveries?.reduce((sum, item) => sum + (item.delivered_qty || 0), 0) || 0;

      return {
        total_in_plant: totalPlant,
        total_in_vehicles: totalVehicles,
        total_delivered_today: totalDelivered,
        unit: 'kg',
      } as GasInventorySummary;
    },
    enabled: !!tenantId,
  });

  // Mutations
  const startRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase
        .from('gas_routes')
        .update({ 
          status: 'in_progress', 
          started_at: new Date().toISOString() 
        })
        .eq('id', routeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_routes_active'] });
      queryClient.invalidateQueries({ queryKey: ['gas_my_route'] });
      toast({ title: '¡Ruta iniciada!', description: 'Puedes comenzar tus entregas.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async ({
      deliveryId,
      deliveredQty,
      receiverName,
      paymentMethod,
    }: {
      deliveryId: string;
      deliveredQty: number;
      receiverName: string;
      paymentMethod: 'cash' | 'transfer' | 'card' | 'credit' | 'no_pay';
    }) => {
      // Update delivery
      const { error: deliveryError } = await supabase
        .from('gas_deliveries')
        .update({
          status: 'delivered',
          delivered_qty: deliveredQty,
          receiver_name: receiverName,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);
      if (deliveryError) throw deliveryError;

      // Create payment event
      const { error: paymentError } = await supabase
        .from('gas_payments_events')
        .insert({
          tenant_id: tenantId,
          delivery_id: deliveryId,
          method: paymentMethod,
          created_by: user?.id,
          collected_by_driver: paymentMethod === 'cash',
        });
      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_deliveries'] });
      toast({ title: '¡Entrega completada!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const finishRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      // Calculate expected return
      const { data: route } = await supabase
        .from('gas_routes')
        .select('assigned_qty')
        .eq('id', routeId)
        .single();

      const { data: deliveries } = await supabase
        .from('gas_deliveries')
        .select('delivered_qty')
        .eq('route_id', routeId)
        .in('status', ['delivered', 'partial']);

      const deliveredTotal = deliveries?.reduce((sum, d) => sum + (d.delivered_qty || 0), 0) || 0;
      const expectedReturn = (route?.assigned_qty || 0) - deliveredTotal;

      const { error } = await supabase
        .from('gas_routes')
        .update({
          status: 'pending_return_review',
          expected_return_qty: expectedReturn,
        })
        .eq('id', routeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_routes_active'] });
      queryClient.invalidateQueries({ queryKey: ['gas_my_route'] });
      toast({ 
        title: 'Ruta finalizada', 
        description: 'Pendiente revisión de inventario devuelto.' 
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    // Queries
    plants: plantsQuery.data || [],
    vehicles: vehiclesQuery.data || [],
    clients: clientsQuery.data || [],
    activeRoutes: activeRoutesQuery.data || [],
    myRoute: myRouteQuery.data,
    anomalies: anomaliesQuery.data || [],
    inventorySummary: inventorySummaryQuery.data,
    useRouteDeliveries,
    
    // Loading states
    isLoading: plantsQuery.isLoading || vehiclesQuery.isLoading || activeRoutesQuery.isLoading,
    
    // Mutations
    startRoute: startRouteMutation.mutate,
    completeDelivery: completeDeliveryMutation.mutate,
    finishRoute: finishRouteMutation.mutate,
    
    // Mutation states
    isStartingRoute: startRouteMutation.isPending,
    isCompletingDelivery: completeDeliveryMutation.isPending,
    isFinishingRoute: finishRouteMutation.isPending,
  };
};
