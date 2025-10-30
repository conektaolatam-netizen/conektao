import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SupplierProductManager from '@/components/SupplierProductManager';
import SupplierStoreSettings from '@/components/SupplierStoreSettings';
import SupplierOrdersView from '@/components/SupplierOrdersView';
import {
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Bell,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  Users,
  MessageSquare
} from 'lucide-react';

interface SupplierStats {
  totalProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  avgRating: number;
  activeOrders: number;
  totalClients: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  restaurantName: string;
  total: number;
  status: string;
  createdAt: string;
}

const SupplierDashboard = () => {
  const { toast } = useToast();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-product' | 'products' | 'orders' | 'store-settings'>('dashboard');
  const [stats, setStats] = useState<SupplierStats>({
    totalProducts: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    avgRating: 0,
    activeOrders: 0,
    totalClients: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      
      // Obtener estadísticas del proveedor
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!supplierData) {
        // Redirigir a configuración si no es proveedor aún
        return;
      }

      // Cargar productos
      const { count: productsCount } = await supabase
        .from('supplier_products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierData.id);

      // Cargar pedidos
      const { data: orders, count: ordersCount } = await supabase
        .from('supplier_orders')
        .select('*, restaurants(name)')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calcular estadísticas
      const activeOrdersCount = orders?.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length || 0;
      const monthlyRevenue = orders?.reduce((sum, order) => sum + (order.total_amount - order.commission_amount || 0), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        monthlyRevenue,
        avgRating: 4.5, // Por ahora hardcodeado
        activeOrders: activeOrdersCount,
        totalClients: 12 // Por ahora hardcodeado
      });

      setRecentOrders(orders?.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        restaurantName: order.restaurants?.name || 'Cliente',
        total: order.total_amount,
        status: order.status,
        createdAt: order.created_at
      })) || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive"
      });
    } finally {
      setDashboardLoading(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  if (currentView !== 'dashboard') {
    switch (currentView) {
      case 'add-product':
      case 'products':
        return <SupplierProductManager view={currentView} onBack={() => setCurrentView('dashboard')} />;
      case 'orders':
        return <SupplierOrdersView onBack={() => setCurrentView('dashboard')} />;
      case 'store-settings':
        return <SupplierStoreSettings onBack={() => setCurrentView('dashboard')} onSave={() => setCurrentView('dashboard')} />;
      default:
        return null;
    }
  }

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panel de Proveedor</h1>
          <p className="text-muted-foreground">Gestiona tu tienda digital y pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              En tu catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              Promedio ⭐⭐⭐⭐⭐
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedidos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.restaurantName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">{formatCurrency(order.total)}</p>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => setCurrentView('add-product')}
            >
              <Package className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setCurrentView('products')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Gestionar Productos
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setCurrentView('orders')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Pedidos
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setCurrentView('store-settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Tienda
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/support'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Soporte
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Commission Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Información de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <p className="text-sm">
            Conektao cobra una comisión del <strong>8%</strong> por cada venta realizada. 
            El dinero se retiene hasta que el cliente confirme la recepción del producto.
            Tú eres responsable de la logística y entrega de tus pedidos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDashboard;