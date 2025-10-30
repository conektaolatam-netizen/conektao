import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  DollarSign,
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  restaurantName: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  estimatedDelivery: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface SupplierOrdersViewProps {
  onBack: () => void;
}

const SupplierOrdersView = ({ onBack }: SupplierOrdersViewProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Obtener ID del proveedor
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

      if (!supplierData) return;

      // Cargar pedidos
      const { data: ordersData, error } = await supabase
        .from('supplier_orders')
        .select(`
          *,
          restaurants(name)
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cargar items de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('supplier_order_items')
            .select(`
              *,
              supplier_products(name)
            `)
            .eq('order_id', order.id);

          return {
            id: order.id,
            orderNumber: order.order_number,
            restaurantName: order.restaurants?.name || 'Cliente',
            status: order.status,
            totalAmount: order.total_amount,
            deliveryAddress: order.delivery_address,
            createdAt: order.created_at,
            estimatedDelivery: order.estimated_delivery || '',
            items: (itemsData || []).map(item => ({
              id: item.id,
              productName: item.supplier_products?.name || 'Producto',
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price
            }))
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('supplier_orders')
        .update({ 
          status,
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado del pedido se actualizó exitosamente"
      });

      loadOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido {selectedOrder.orderNumber}</h1>
            <p className="text-muted-foreground">
              Cliente: {selectedOrder.restaurantName}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Información de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                {selectedOrder.estimatedDelivery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Entrega estimada: {new Date(selectedOrder.estimatedDelivery).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-white`}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fecha del pedido:</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Status Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Actualizar Estado</h4>
                  
                  {selectedOrder.status === 'pending' && (
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Pedido
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Cancelar Pedido
                      </Button>
                    </div>
                  )}

                  {selectedOrder.status === 'confirmed' && (
                    <Button 
                      className="w-full"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Comenzar Preparación
                    </Button>
                  )}

                  {selectedOrder.status === 'processing' && (
                    <Button 
                      className="w-full"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Marcar como Enviado
                    </Button>
                  )}

                  {selectedOrder.status === 'shipped' && (
                    <Button 
                      className="w-full"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Entrega
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los pedidos de tu tienda
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes pedidos aún</h3>
              <p className="text-muted-foreground text-center">
                Los pedidos que recibas de restaurantes aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent 
                className="p-6"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground">
                      Cliente: {order.restaurantName}
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} producto(s) • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-xl">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Comisión: {formatCurrency(order.totalAmount * 0.08)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierOrdersView;