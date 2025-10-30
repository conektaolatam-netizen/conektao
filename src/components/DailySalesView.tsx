import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InvoiceEditor from '@/components/InvoiceEditor';
import { getLocalDayRange } from '@/lib/date';
import { 
  ArrowLeft,
  Receipt,
  CreditCard,
  Banknote,
  Users,
  Clock,
  ShoppingCart,
  Eye,
  Phone,
  MapPin,
  Utensils,
  Truck,
  Edit3
} from 'lucide-react';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  table_number: number | null;
  customer_email: string | null;
  status: string;
  created_at: string;
  user_id: string;
  sale_items: SaleItem[];
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
  };
}

interface DailySalesViewProps {
  onClose: () => void;
}

const DailySalesView: React.FC<DailySalesViewProps> = ({ onClose }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadTodaysSales();
  }, []);

  const loadTodaysSales = async () => {
    try {
      // Usar la función getLocalDayRange para obtener fechas precisas del día local
      const { startISO, endISO } = getLocalDayRange();
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            products(id, name, price)
          )
        `)
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas del día",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (sale: Sale) => {
    setEditingSale(sale);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingSale(null);
  };

  const handleSaleUpdated = async () => {
    await loadTodaysSales();
    setIsEditorOpen(false);
    setSelectedSale(null);
    setEditingSale(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo':
        return <Banknote className="h-4 w-4" />;
      case 'tarjeta':
      case 'tarjeta de credito':
      case 'tarjeta de debito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
      case 'tarjeta de credito':
      case 'tarjeta de debito':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDailySales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const deliveryOrders = sales.filter(sale => sale.table_number === null);
  const dineInOrders = sales.filter(sale => sale.table_number !== null);

  if (selectedSale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <Receipt className="h-6 w-6 mr-3" />
                    Detalle de Factura
                  </CardTitle>
                  <p className="text-white/90 mt-2">
                    {selectedSale.table_number ? `Mesa ${selectedSale.table_number}` : 'Domicilio'} • {formatTime(selectedSale.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setSelectedSale(null)}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <Button 
                    onClick={() => openEditor(selectedSale)}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información de la venta */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Productos Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedSale.sale_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.products.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h3 className="text-xl font-bold">Total</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSale.total_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del pedido */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedSale.table_number ? <Utensils className="h-5 w-5 mr-2" /> : <Truck className="h-5 w-5 mr-2" />}
                    Información del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Orden</p>
                    <div className="flex items-center mt-1">
                      {selectedSale.table_number ? (
                        <>
                          <Utensils className="h-4 w-4 mr-2 text-orange-600" />
                          <span className="font-medium">Mesa {selectedSale.table_number}</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">Domicilio</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pago</p>
                    <Badge className={`mt-1 ${getPaymentMethodColor(selectedSale.payment_method)}`}>
                      <div className="flex items-center">
                        {getPaymentMethodIcon(selectedSale.payment_method)}
                        <span className="ml-1 capitalize">{selectedSale.payment_method}</span>
                      </div>
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-medium">{formatTime(selectedSale.created_at)}</span>
                    </div>
                  </div>

                  {selectedSale.customer_email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <div className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="font-medium">{selectedSale.customer_email}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={selectedSale.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {selectedSale.status === 'completed' ? 'Completado' : selectedSale.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoice Editor Modal */}
          <InvoiceEditor
            sale={editingSale}
            isOpen={isEditorOpen}
            onClose={closeEditor}
            onSaleUpdated={handleSaleUpdated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center">
                  <Receipt className="h-8 w-8 mr-3" />
                  Facturas de Hoy
                </CardTitle>
                <p className="text-white/90 mt-2">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Button 
                onClick={onClose}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Total Ventas</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDailySales)}</p>
                </div>
                <Receipt className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Total Órdenes</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Órdenes Mesa</p>
                  <p className="text-2xl font-bold">{dineInOrders.length}</p>
                </div>
                <Utensils className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Domicilios</p>
                  <p className="text-2xl font-bold">{deliveryOrders.length}</p>
                </div>
                <Truck className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay ventas hoy</h3>
            <p className="text-muted-foreground">
              Las ventas del día aparecerán aquí cuando se realicen.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {sale.table_number ? (
                        <>
                          <Utensils className="h-5 w-5 text-orange-600" />
                          <span className="font-medium">Mesa {sale.table_number}</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">Domicilio</span>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatTime(sale.created_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-bold text-lg">{formatCurrency(sale.total_amount)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Productos</span>
                      <span className="text-sm">{sale.sale_items.length} items</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pago</span>
                      <Badge className={getPaymentMethodColor(sale.payment_method)}>
                        <div className="flex items-center">
                          {getPaymentMethodIcon(sale.payment_method)}
                          <span className="ml-1 capitalize">{sale.payment_method}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                      onClick={() => setSelectedSale(sale)}
                      className="w-full bg-gradient-to-r from-primary to-secondary"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                    <Button 
                      onClick={() => openEditor(sale)}
                      variant="secondary"
                      className="w-full bg-gradient-to-r from-secondary to-primary/80"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Invoice Editor Modal */}
        <InvoiceEditor
          sale={editingSale}
          isOpen={isEditorOpen}
          onClose={closeEditor}
          onSaleUpdated={handleSaleUpdated}
        />
      </div>
  </div>
);
};

export default DailySalesView;