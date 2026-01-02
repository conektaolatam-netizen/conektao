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

  // Create Route Mutation
  const createRouteMutation = useMutation({
    mutationFn: async ({
      plantId,
      vehicleId,
      assignedQty,
      deliveries,
    }: {
      plantId: string;
      vehicleId: string;
      assignedQty: number;
      deliveries: { clientId: string; plannedQty: number; order: number }[];
    }) => {
      // Generate route number
      const { data: routeNumber } = await supabase.rpc('generate_gas_route_number', { p_tenant_id: tenantId });
      
      // Create route
      const { data: route, error: routeError } = await supabase
        .from('gas_routes')
        .insert({
          tenant_id: tenantId!,
          route_number: routeNumber || `R-${Date.now()}`,
          plant_id: plantId,
          vehicle_id: vehicleId,
          assigned_qty: assignedQty,
          assigned_unit: 'kg',
          status: 'planned',
          planned_date: new Date().toISOString().split('T')[0],
          created_by: user?.id,
        })
        .select()
        .single();
      if (routeError) throw routeError;

      // Create deliveries
      const deliveryRecords = deliveries.map(d => ({
        tenant_id: tenantId!,
        route_id: route.id,
        client_id: d.clientId,
        planned_qty: d.plannedQty,
        delivery_order: d.order,
        unit: 'kg',
        status: 'pending',
      }));

      const { error: deliveriesError } = await supabase
        .from('gas_deliveries')
        .insert(deliveryRecords);
      if (deliveriesError) throw deliveriesError;

      // Create inventory movement (transfer from plant to vehicle)
      const { error: inventoryError } = await supabase
        .from('gas_inventory_ledger')
        .insert({
          tenant_id: tenantId!,
          plant_id: plantId,
          vehicle_id: vehicleId,
          movement_type: 'transfer_out',
          qty: -assignedQty,
          unit: 'kg',
          reference_type: 'route',
          reference_id: route.id,
          notes: `Asignación a ruta ${route.route_number}`,
          created_by: user?.id,
        });
      if (inventoryError) throw inventoryError;

      // Add to vehicle
      const { error: vehicleInventoryError } = await supabase
        .from('gas_inventory_ledger')
        .insert({
          tenant_id: tenantId!,
          vehicle_id: vehicleId,
          movement_type: 'transfer_in',
          qty: assignedQty,
          unit: 'kg',
          reference_type: 'route',
          reference_id: route.id,
          notes: `Carga para ruta ${route.route_number}`,
          created_by: user?.id,
        });
      if (vehicleInventoryError) throw vehicleInventoryError;

      return route;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_routes_active'] });
      queryClient.invalidateQueries({ queryKey: ['gas_inventory_summary'] });
      toast({ title: '¡Ruta creada!', description: 'La ruta está lista para ejecutarse.' });
    },
    onError: (error) => {
      toast({ title: 'Error al crear ruta', description: error.message, variant: 'destructive' });
    },
  });

  // Review Return Mutation
  const reviewReturnMutation = useMutation({
    mutationFn: async ({
      routeId,
      actualReturnQty,
      mermaReason,
    }: {
      routeId: string;
      actualReturnQty: number;
      mermaReason?: string;
    }) => {
      const { data: route } = await supabase
        .from('gas_routes')
        .select('*, vehicle:gas_vehicles(*), plant:gas_plants(*)')
        .eq('id', routeId)
        .single();

      if (!route) throw new Error('Ruta no encontrada');

      const expectedReturn = route.expected_return_qty || 0;
      const difference = expectedReturn - actualReturnQty;

      // Update route
      const { error: routeError } = await supabase
        .from('gas_routes')
        .update({
          actual_return_qty: actualReturnQty,
          status: 'closed',
          closed_at: new Date().toISOString(),
          return_reviewed_by: user?.id,
          return_reviewed_at: new Date().toISOString(),
        })
        .eq('id', routeId);
      if (routeError) throw routeError;

      // Return inventory to plant
      const { error: returnError } = await supabase
        .from('gas_inventory_ledger')
        .insert({
          tenant_id: tenantId!,
          plant_id: route.plant_id,
          vehicle_id: route.vehicle_id,
          movement_type: 'return',
          qty: actualReturnQty,
          unit: 'kg',
          reference_type: 'route',
          reference_id: routeId,
          notes: `Devolución de ruta ${route.route_number}`,
          created_by: user?.id,
        });
      if (returnError) throw returnError;

      // If there's merma, create merma movement and anomaly
      if (difference > 0.5) {
        const { error: mermaError } = await supabase
          .from('gas_inventory_ledger')
          .insert({
            tenant_id: tenantId!,
            vehicle_id: route.vehicle_id,
            movement_type: 'merma',
            qty: -difference,
            unit: 'kg',
            reference_type: 'route',
            reference_id: routeId,
            notes: mermaReason || 'Merma detectada en revisión',
            created_by: user?.id,
          });
        if (mermaError) throw mermaError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_routes_active'] });
      queryClient.invalidateQueries({ queryKey: ['gas_inventory_summary'] });
      queryClient.invalidateQueries({ queryKey: ['gas_anomalies'] });
      toast({ title: 'Ruta cerrada', description: 'Inventario actualizado correctamente.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create Plant Mutation
  const createPlantMutation = useMutation({
    mutationFn: async ({
      name,
      locationText,
      capacityValue,
    }: {
      name: string;
      locationText: string | null;
      capacityValue: number | null;
    }) => {
      const { error } = await supabase
        .from('gas_plants')
        .insert({
          tenant_id: tenantId!,
          name,
          location_text: locationText,
          capacity_value: capacityValue,
          capacity_unit: 'kg',
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_plants'] });
      toast({ title: '¡Planta creada!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create Vehicle Mutation
  const createVehicleMutation = useMutation({
    mutationFn: async ({
      plate,
      capacityValue,
      driverName,
      driverPhone,
    }: {
      plate: string;
      capacityValue: number;
      driverName: string | null;
      driverPhone: string | null;
    }) => {
      const { error } = await supabase
        .from('gas_vehicles')
        .insert({
          tenant_id: tenantId!,
          plate,
          capacity_value: capacityValue,
          capacity_unit: 'kg',
          driver_name: driverName,
          driver_phone: driverPhone,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_vehicles'] });
      toast({ title: '¡Vehículo creado!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create Client Mutation
  const createClientMutation = useMutation({
    mutationFn: async ({
      name,
      contactName,
      contactPhone,
      email,
      address,
      city,
      clientType,
      notes,
    }: {
      name: string;
      contactName: string | null;
      contactPhone: string | null;
      email: string | null;
      address: string;
      city: string | null;
      clientType: 'contract' | 'free';
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from('gas_clients')
        .insert({
          tenant_id: tenantId!,
          name,
          contact_name: contactName,
          contact_phone: contactPhone,
          email,
          address,
          city,
          client_type: clientType,
          status: 'active',
          notes,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_clients'] });
      toast({ title: '¡Cliente creado!' });
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
    createRoute: createRouteMutation.mutate,
    reviewRouteReturn: reviewReturnMutation.mutate,
    createPlant: createPlantMutation.mutate,
    createVehicle: createVehicleMutation.mutate,
    createClient: createClientMutation.mutate,
    
    // Mutation states
    isStartingRoute: startRouteMutation.isPending,
    isCompletingDelivery: completeDeliveryMutation.isPending,
    isFinishingRoute: finishRouteMutation.isPending,
    isCreatingRoute: createRouteMutation.isPending,
    isReviewingReturn: reviewReturnMutation.isPending,
    isCreatingPlant: createPlantMutation.isPending,
    isCreatingVehicle: createVehicleMutation.isPending,
    isCreatingClient: createClientMutation.isPending,
  };
};
