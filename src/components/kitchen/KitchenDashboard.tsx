import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  Bell, 
  RefreshCw, 
  Timer, 
  Users, 
  Utensils,
  History,
  XCircle,
  Flame,
  Save,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KitchenOrderCard from './KitchenOrderCard';
import KitchenCancelModal from './KitchenCancelModal';
import KitchenHistorySection from './KitchenHistorySection';
import { saveDailyKitchenReportToDocuments } from '@/lib/kitchenReports';

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_items: number;
  priority: 'normal' | 'high' | 'urgent';
  estimated_time: number | null;
  sent_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  notes: string | null;
  user_id: string;
  waiter_id?: string | null;
  restaurant_id: string;
  items: KitchenOrderItem[];
}

interface KitchenOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  special_instructions: string | null;
  status: 'pending' | 'preparing' | 'ready';
}

interface KitchenNotification {
  id: string;
  kitchen_order_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const KitchenDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [notifications, setNotifications] = useState<KitchenNotification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animatingOutIds, setAnimatingOutIds] = useState<Set<string>>(new Set());
  const [isSavingReport, setIsSavingReport] = useState(false);
  
  // Modal de anulación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<KitchenOrder | null>(null);
  
  // Verificar permisos de anulación
  const canCancelOrders = profile?.role === 'owner' || 
    profile?.role === 'admin' || 
    (profile?.permissions as any)?.can_cancel_kitchen_order;

  // ✅ VALIDACIÓN CRÍTICA: Verificar que el perfil está configurado correctamente
  const isProfileConfigured = !!profile?.restaurant_id;

  // Log para debug si hay problema de configuración
  useEffect(() => {
    if (user && !profile) {
      console.error('[KITCHEN DASHBOARD] Usuario sin perfil:', user.id, user.email);
    } else if (profile && !profile.restaurant_id) {
      console.error('[KITCHEN DASHBOARD] Perfil sin restaurant_id:', profile.id, profile.email);
    }
  }, [user, profile]);

  // Guardar historial del día en documentos
  const handleSaveDailyReport = async () => {
    if (!profile?.restaurant_id || !user?.id) return;
    
    setIsSavingReport(true);
    try {
      const docId = await saveDailyKitchenReportToDocuments(
        profile.restaurant_id,
        user.id,
        new Date()
      );
      
      if (docId) {
        toast({
          title: "📄 Historial guardado",
          description: "El historial del día se guardó en Documentos → Comandas",
          className: "bg-emerald-900/90 border-emerald-600 text-white"
        });
      } else {
        throw new Error('No se pudo guardar');
      }
    } catch (error) {
      console.error('Error saving daily report:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el historial",
        variant: "destructive"
      });
    } finally {
      setIsSavingReport(false);
    }
  };

  // Cargar comandas
  const loadOrders = async () => {
    if (!profile?.restaurant_id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('kitchen_orders')
        .select(`
          *,
          kitchen_order_items (*)
        `)
        .eq('restaurant_id', profile.restaurant_id)
        .gte('created_at', today.toISOString())
        .order('sent_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      setOrders(ordersData?.map(order => ({
        ...order,
        status: order.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: order.priority as 'normal' | 'high' | 'urgent',
        items: order.kitchen_order_items?.map((item: any) => ({
          ...item,
          status: item.status as 'pending' | 'preparing' | 'ready'
        })) || []
      })) || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las comandas",
        variant: "destructive"
      });
    }
  };

  // Cargar notificaciones
  const loadNotifications = async () => {
    if (!profile?.restaurant_id) return;
    try {
      const { data, error } = await supabase
        .from('kitchen_notifications')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Registrar evento de cocina
  const logKitchenEvent = async (
    kitchenOrderId: string, 
    previousStatus: string | null, 
    newStatus: string,
    reasonType?: string,
    reasonComment?: string
  ) => {
    if (!profile?.restaurant_id || !user) return;
    
    try {
      await supabase.from('kitchen_order_events').insert({
        restaurant_id: profile.restaurant_id,
        kitchen_order_id: kitchenOrderId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by_user_id: user.id,
        changed_by_name: profile.full_name || profile.email,
        reason_type: reasonType || null,
        reason_comment: reasonComment || null
      });
    } catch (error) {
      console.error('Error logging kitchen event:', error);
    }
  };

  // Notificar al mesero
  const notifyWaiter = async (order: KitchenOrder, message: string) => {
    if (!profile?.restaurant_id) return;
    
    try {
      // Crear notificación en kitchen_notifications
      await supabase.from('kitchen_notifications').insert({
        restaurant_id: profile.restaurant_id,
        kitchen_order_id: order.id,
        type: 'ORDER_READY',
        message,
        is_read: false
      });

      // También crear una notificación general si hay waiter_id
      if (order.waiter_id) {
        await supabase.from('notifications').insert({
          user_id: order.waiter_id,
          type: 'KITCHEN_ORDER_READY',
          title: '🍽️ ¡Comanda lista!',
          message: `Orden #${order.order_number} está lista para entregar`,
          data: { 
            order_id: order.id, 
            order_number: order.order_number,
            table_number: order.table_number 
          }
        });
      }
    } catch (error) {
      console.error('Error notifying waiter:', error);
    }
  };

  // Marcar como iniciado
  const startOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Registrar evento
      await logKitchenEvent(orderId, order.status, 'in_progress');
      
      await loadOrders();
      
      toast({
        title: "🍳 Preparación iniciada",
        description: `Orden #${order.order_number} en cocina`,
        className: "bg-cyan-900/90 border-cyan-600 text-white"
      });
    } catch (error) {
      console.error('Error starting order:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la orden",
        variant: "destructive"
      });
    }
  };

  // Marcar como completado con animación
  const completeOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Añadir a animación de salida
    setAnimatingOutIds(prev => new Set(prev).add(orderId));
    
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Registrar evento
      await logKitchenEvent(orderId, order.status, 'completed');
      
      // Notificar al mesero
      await notifyWaiter(order, `¡Orden #${order.order_number} está lista para entregar!`);

      // Efectos visuales y sonoros
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Sonido de completado
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMapVP');
        audio.play().catch(() => {});
      } catch (e) {}

      // Esperar animación y recargar
      setTimeout(async () => {
        await loadOrders();
        setAnimatingOutIds(prev => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }, 400);
      
      toast({
        title: "✅ ¡Orden completada!",
        description: `Orden #${order.order_number} lista. Mesero notificado.`,
        className: "bg-emerald-900/90 border-emerald-600 text-white"
      });
    } catch (error) {
      console.error('Error completing order:', error);
      setAnimatingOutIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      toast({
        title: "Error",
        description: "No se pudo completar la orden",
        variant: "destructive"
      });
    }
  };

  // Abrir modal de anulación
  const handleCancelClick = (order: KitchenOrder) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  // Confirmar anulación
  const handleCancelConfirm = async (reasonType: string, reasonComment: string) => {
    if (!orderToCancel) return;
    
    const order = orderToCancel;
    
    // Animación de salida
    setAnimatingOutIds(prev => new Set(prev).add(order.id));
    
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: reasonType
        })
        .eq('id', order.id);

      if (error) throw error;
      
      // Registrar evento con motivo
      await logKitchenEvent(order.id, order.status, 'cancelled', reasonType, reasonComment);
      
      // Crear alerta para el dueño
      if (profile?.restaurant_id) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('owner_id')
          .eq('id', profile.restaurant_id)
          .single();
        
        if (restaurant?.owner_id) {
          await supabase.from('owner_alerts').insert({
            owner_id: restaurant.owner_id,
            restaurant_id: profile.restaurant_id,
            alert_type: 'KITCHEN_ORDER_CANCELLED',
            severity: 'medium',
            title: `Comanda #${order.order_number} anulada`,
            description: `Motivo: ${reasonType}${reasonComment ? ` - ${reasonComment}` : ''}`,
            triggered_by: user?.id,
            triggered_by_name: profile.full_name || profile.email,
            metadata: {
              order_id: order.id,
              order_number: order.order_number,
              table_number: order.table_number,
              reason_type: reasonType,
              reason_comment: reasonComment
            }
          });
        }
      }

      // Cerrar modal y esperar animación
      setCancelModalOpen(false);
      setOrderToCancel(null);
      
      setTimeout(async () => {
        await loadOrders();
        setAnimatingOutIds(prev => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
      }, 400);
      
      toast({
        title: "❌ Comanda anulada",
        description: `Orden #${order.order_number} ha sido anulada. Motivo registrado.`,
        className: "bg-red-900/90 border-red-600 text-white"
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      setAnimatingOutIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
      throw error;
    }
  };

  // Marcar notificaciones como leídas
  const markNotificationsAsRead = async () => {
    if (!profile?.restaurant_id || unreadCount === 0) return;
    try {
      const { error } = await supabase
        .from('kitchen_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('restaurant_id', profile.restaurant_id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(0);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Configurar tiempo real
  useEffect(() => {
    if (!profile?.restaurant_id) return;
    
    loadOrders();
    loadNotifications();
    setLoading(false);

    // Suscribirse a nuevas comandas
    const ordersChannel = supabase
      .channel('kitchen-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kitchen_orders',
        filter: `restaurant_id=eq.${profile.restaurant_id}`
      }, payload => {
        console.log('Order change:', payload);
        loadOrders();
        
        if (payload.eventType === 'INSERT') {
          // Nueva comanda - efectos visuales/sonoros
          if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
          
          // Sonido de nueva orden
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleWQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
            audio.play().catch(() => {});
          } catch (e) {}
          
          toast({
            title: "🔔 ¡Nueva comanda!",
            description: `Comanda #${(payload.new as any).order_number} recibida`,
            className: "bg-orange-900/90 border-orange-500 text-white animate-pulse"
          });
        }
      })
      .subscribe();

    // Suscribirse a notificaciones
    const notificationsChannel = supabase
      .channel('kitchen-notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'kitchen_notifications',
        filter: `restaurant_id=eq.${profile.restaurant_id}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [profile?.restaurant_id]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'in_progress': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Preparación';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Anulado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const activeOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );
  const completedOrders = orders.filter(order => order.status === 'completed');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-sm text-slate-400">Cargando comandas...</p>
        </div>
      </div>
    );
  }

  // ✅ VALIDACIÓN CRÍTICA: Mostrar error si el perfil no está configurado
  if (!isProfileConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Card className="max-w-md p-8 text-center bg-slate-800 border-amber-500/50">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Cuenta no configurada</h3>
          <p className="text-slate-400 mb-4">
            Tu perfil no está vinculado a ningún restaurante. 
            Contacta al administrador para que vincule tu cuenta.
          </p>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 text-left">
            <p className="text-xs text-slate-500">Debug info:</p>
            <p className="text-xs text-slate-400 font-mono">
              Usuario: {user?.email || 'No autenticado'}<br/>
              Perfil: {profile ? 'Existe' : 'No existe'}<br/>
              Restaurant ID: {profile?.restaurant_id || 'No asignado'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4 space-y-4">
      {/* Header */}
      <div className="rounded-xl shadow-xl p-4 bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-xl shadow-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                Panel de Cocina
              </h1>
              <p className="text-sm text-slate-400">Comandas en tiempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markNotificationsAsRead} 
                className="relative bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <Bell className="h-4 w-4 text-slate-300" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadOrders} 
              className="gap-2 bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {activeOrders.filter(o => o.status === 'pending').length}
            </p>
          </div>
          
          <div className="rounded-xl p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">En Proceso</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {activeOrders.filter(o => o.status === 'in_progress').length}
            </p>
          </div>
          
          <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {completedOrders.length}
            </p>
          </div>
          
          <div className="rounded-xl p-3 bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-slate-300 mt-1">
              {activeOrders.reduce((sum, order) => sum + order.total_items, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Activas / Historial */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-slate-400"
          >
            <Flame className="h-4 w-4 mr-2" />
            Comandas Activas ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-slate-400"
          >
            <History className="h-4 w-4 mr-2" />
            Historial del Día
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 mb-4">
                  <ChefHat className="h-12 w-12 text-slate-500" />
                </div>
                <p className="text-slate-400 text-center text-lg">No hay comandas activas</p>
                <p className="text-sm text-slate-500 text-center mt-1">
                  Las nuevas comandas aparecerán aquí automáticamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {activeOrders.map(order => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onStart={startOrder}
                    onComplete={completeOrder}
                    onViewDetails={(o) => {
                      setSelectedOrder(o);
                      setIsDetailOpen(true);
                    }}
                    onCancel={handleCancelClick}
                    canCancel={canCancelOrders}
                    isAnimatingOut={animatingOutIds.has(order.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                    <History className="h-5 w-5 text-slate-400" />
                    Historial del Día
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    Comandas completadas y anuladas de hoy
                  </p>
                </div>
                
                {/* Botón para guardar historial en documentos */}
                <Button
                  onClick={handleSaveDailyReport}
                  disabled={isSavingReport || (completedOrders.length === 0 && cancelledOrders.length === 0)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  {isSavingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar en Documentos
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <KitchenHistorySection 
                completedOrders={completedOrders}
                cancelledOrders={cancelledOrders}
              />
              
              {/* Info de dónde se guarda */}
              {(completedOrders.length > 0 || cancelledOrders.length > 0) && (
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FileText className="h-4 w-4" />
                    <span>
                      El historial se guarda en <strong className="text-slate-300">Documentos → Comandas</strong>, 
                      organizado por mes y día para consultas futuras y análisis de IA.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalles */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ChefHat className="h-5 w-5 text-orange-400" />
              Detalles de Comanda #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Información general */}
              <div className="bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-700">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Mesa:</span>
                  <span className="font-medium text-slate-200">
                    {selectedOrder.table_number ? `Mesa ${selectedOrder.table_number}` : 'Domicilio'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Estado:</span>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Prioridad:</span>
                  <Badge className={getPriorityColor(selectedOrder.priority)}>
                    {selectedOrder.priority === 'urgent' ? '🔥 Urgente' : 
                     selectedOrder.priority === 'high' ? '⚡ Alta' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Hora recibido:</span>
                  <span className="font-medium text-slate-200">{formatTime(selectedOrder.sent_at)}</span>
                </div>
                {selectedOrder.started_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Hora iniciado:</span>
                    <span className="font-medium text-slate-200">{formatTime(selectedOrder.started_at)}</span>
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-200">Productos pedidos:</h4>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg p-3 space-y-2 bg-slate-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-200">{item.product_name}</p>
                        <p className="text-sm text-slate-400">Cantidad: {item.quantity}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    {item.special_instructions && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                        <p className="text-sm text-yellow-300">
                          <strong>📝 Observaciones:</strong> {item.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notas generales */}
              {selectedOrder.notes && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <h4 className="font-medium text-cyan-300 mb-2">Notas de la comanda:</h4>
                  <p className="text-sm text-cyan-200">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <Button 
                    onClick={() => {
                      startOrder(selectedOrder.id);
                      setIsDetailOpen(false);
                    }} 
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  >
                    <Flame className="h-4 w-4 mr-2" />
                    Iniciar Preparación
                  </Button>
                )}
                
                {selectedOrder.status === 'in_progress' && (
                  <Button 
                    onClick={() => {
                      completeOrder(selectedOrder.id);
                      setIsDetailOpen(false);
                    }} 
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Lista
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de anulación */}
      <KitchenCancelModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        orderNumber={orderToCancel?.order_number || ''}
      />
    </div>
  );
};

export default KitchenDashboard;
