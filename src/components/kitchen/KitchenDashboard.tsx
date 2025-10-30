import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Bell,
  RefreshCw,
  Timer,
  Users,
  Utensils
} from 'lucide-react';

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
  notes: string | null;
  user_id: string;
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

  // Cargar comandas
  const loadOrders = async () => {
    if (!profile?.restaurant_id) return;

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('kitchen_orders')
        .select(`
          *,
          kitchen_order_items (*)
        `)
        .eq('restaurant_id', profile.restaurant_id)
        .order('sent_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData?.map(order => ({
        ...order,
        status: order.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: order.priority as 'normal' | 'high' | 'urgent',
        items: order.kitchen_order_items?.map(item => ({
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

  // Marcar como iniciado
  const startOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      toast({
        title: "Orden iniciada",
        description: "La preparación ha comenzado"
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

  // Marcar como completado
  const completeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      
      // Efectos visuales y sonoros
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Sonido de completado (se puede agregar un audio)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMapVP');
        audio.play().catch(() => {}); // Silenciar errores de audio
      } catch (e) {}

      toast({
        title: "¡Orden completada!",
        description: "La comanda ha sido marcada como lista",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la orden",
        variant: "destructive"
      });
    }
  };

  // Marcar notificaciones como leídas
  const markNotificationsAsRead = async () => {
    if (!profile?.restaurant_id || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from('kitchen_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kitchen_orders',
          filter: `restaurant_id=eq.${profile.restaurant_id}`
        },
        (payload) => {
          console.log('Order change:', payload);
          loadOrders();
          
          if (payload.eventType === 'INSERT') {
            // Nueva comanda - efectos visuales/sonoros
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500, 200, 500]);
            }
            
            toast({
              title: "¡Nueva comanda!",
              description: `Comanda #${payload.new.order_number} recibida`,
              className: "bg-orange-50 border-orange-200 animate-pulse"
            });
          }
        }
      )
      .subscribe();

    // Suscribirse a notificaciones
    const notificationsChannel = supabase
      .channel('kitchen-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kitchen_notifications',
          filter: `restaurant_id=eq.${profile.restaurant_id}`
        },
        (payload) => {
          console.log('New notification:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [profile?.restaurant_id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Preparación';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getElapsedTime = (sentAt: string) => {
    const now = new Date();
    const sent = new Date(sentAt);
    const diffMs = now.getTime() - sent.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
  const completedOrders = orders.filter(order => order.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando comandas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChefHat className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Panel de Cocina</h1>
              <p className="text-sm text-gray-500">Gestión de comandas en tiempo real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markNotificationsAsRead}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Pendientes</span>
            </div>
            <p className="text-lg font-semibold text-yellow-900">
              {activeOrders.filter(o => o.status === 'pending').length}
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">En Proceso</span>
            </div>
            <p className="text-lg font-semibold text-blue-900">
              {activeOrders.filter(o => o.status === 'in_progress').length}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Completadas</span>
            </div>
            <p className="text-lg font-semibold text-green-900">
              {completedOrders.length}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Total Items</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {activeOrders.reduce((sum, order) => sum + order.total_items, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Comandas Activas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Comandas Activas</h2>
        
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">No hay comandas activas</p>
              <p className="text-sm text-gray-400 text-center mt-1">
                Las nuevas comandas aparecerán aquí automáticamente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <Card 
                key={order.id} 
                className={`border-l-4 ${
                  order.priority === 'urgent' ? 'border-l-red-500' :
                  order.priority === 'high' ? 'border-l-orange-500' :
                  'border-l-gray-300'
                } transition-all hover:shadow-md`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {order.table_number && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            <span className="text-sm text-gray-600">Mesa {order.table_number}</span>
                          </div>
                        )}
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority === 'urgent' ? 'Urgente' :
                           order.priority === 'high' ? 'Alta' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recibido:</span>
                    <span className="font-medium">{formatTime(order.sent_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tiempo transcurrido:</span>
                    <span className="font-medium text-orange-600">
                      {getElapsedTime(order.sent_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{order.total_items}</span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Productos:</h4>
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.product_name}
                        </span>
                        {item.special_instructions && (
                          <Badge variant="outline" className="text-xs">
                            Con observaciones
                          </Badge>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{order.items.length - 3} productos más
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    {order.status === 'pending' ? (
                      <Button
                        onClick={() => startOrder(order.id)}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    ) : (
                      <Button
                        onClick={() => completeOrder(order.id)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de detalles */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Detalles de Comanda #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Información general */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mesa:</span>
                  <span className="font-medium">
                    {selectedOrder.table_number ? `Mesa ${selectedOrder.table_number}` : 'Domicilio'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prioridad:</span>
                  <Badge className={getPriorityColor(selectedOrder.priority)}>
                    {selectedOrder.priority === 'urgent' ? 'Urgente' :
                     selectedOrder.priority === 'high' ? 'Alta' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hora recibido:</span>
                  <span className="font-medium">{formatTime(selectedOrder.sent_at)}</span>
                </div>
                {selectedOrder.started_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hora iniciado:</span>
                    <span className="font-medium">{formatTime(selectedOrder.started_at)}</span>
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Productos pedidos:</h4>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                    {item.special_instructions && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Observaciones:</strong> {item.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notas generales */}
              {selectedOrder.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Notas de la comanda:</h4>
                  <p className="text-sm text-blue-800">{selectedOrder.notes}</p>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Iniciar Preparación
                  </Button>
                )}
                
                {selectedOrder.status === 'in_progress' && (
                  <Button
                    onClick={() => {
                      completeOrder(selectedOrder.id);
                      setIsDetailOpen(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Listo
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KitchenDashboard;