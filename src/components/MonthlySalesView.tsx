import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Receipt,
  Calendar,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  table_number: number | null;
  customer_email: string | null;
  status: string;
  created_at: string;
  sale_items: SaleItem[];
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    name: string;
    price: number;
  };
}

interface DailySales {
  date: string;
  sales: Sale[];
  total: number;
  count: number;
}

interface MonthlySalesViewProps {
  onClose: () => void;
}

const MonthlySalesView: React.FC<MonthlySalesViewProps> = ({ onClose }) => {
  const [dailySalesGroups, setDailySalesGroups] = useState<DailySales[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const currentDate = new Date();
  const isCurrentMonth = selectedDate.getFullYear() === currentDate.getFullYear() && 
                        selectedDate.getMonth() === currentDate.getMonth();

  useEffect(() => {
    loadMonthlySales();
  }, [selectedDate]);

  const loadMonthlySales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            products(name, price)
          )
        `)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar ventas por día
      const grouped = groupSalesByDay(data || []);
      setDailySalesGroups(grouped);
      // Limpiar días expandidos al cambiar de mes
      setExpandedDays([]);
    } catch (error: any) {
      console.error('Error loading monthly sales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas del mes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const groupSalesByDay = (sales: Sale[]): DailySales[] => {
    const groups: { [key: string]: Sale[] } = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('es-ES');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(sale);
    });

    return Object.entries(groups).map(([date, salesForDay]) => ({
      date,
      sales: salesForDay,
      total: salesForDay.reduce((sum, sale) => sum + sale.total_amount, 0),
      count: salesForDay.length
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const canNavigateNext = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= currentDate;
  };

  const totalMonthlySales = dailySalesGroups.reduce((sum, day) => sum + day.total, 0);
  const totalMonthlyCount = dailySalesGroups.reduce((sum, day) => sum + day.count, 0);

  if (selectedSale) {
    // Reutilizar el componente de detalle de factura de DailySalesView
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
                <Button 
                  onClick={() => setSelectedSale(null)}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información de la venta */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
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
            <Card>
              <CardHeader>
                <CardTitle>Información del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium capitalize">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                  <p className="font-medium">{new Date(selectedSale.created_at).toLocaleString('es-ES')}</p>
                </div>
                {selectedSale.customer_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedSale.customer_email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={selectedSale.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedSale.status === 'completed' ? 'Completado' : selectedSale.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
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
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold flex items-center">
                  <Calendar className="h-8 w-8 mr-3" />
                  Historial de Facturas
                </CardTitle>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => navigateMonth('prev')}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center min-w-[200px]">
                      <p className="text-xl font-semibold">
                        {selectedDate.toLocaleDateString('es-ES', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      {isCurrentMonth && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mt-1">
                          Mes Actual
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => navigateMonth('next')}
                      variant="secondary"
                      size="sm"
                      disabled={!canNavigateNext()}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Total del Mes</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalMonthlySales)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Total Facturas</p>
                  <p className="text-2xl font-bold">{totalMonthlyCount}</p>
                </div>
                <Receipt className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90">Días con Ventas</p>
                  <p className="text-2xl font-bold">{dailySalesGroups.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales by Day */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dailySalesGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No hay ventas en {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-muted-foreground">
              {isCurrentMonth 
                ? 'Las ventas del mes aparecerán aquí cuando se realicen.'
                : 'No se registraron ventas en este mes.'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {dailySalesGroups.map((dayGroup) => (
              <Card key={dayGroup.date} className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleDayExpansion(dayGroup.date)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {expandedDays.includes(dayGroup.date) ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">{dayGroup.date}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dayGroup.count} facturas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(dayGroup.total)}</p>
                        <Badge variant="outline">
                          {dayGroup.count} ventas
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {expandedDays.includes(dayGroup.date) && (
                    <div className="border-t bg-gray-50/50">
                      <div className="p-6 space-y-4">
                        {dayGroup.sales.map((sale) => (
                          <div 
                            key={sale.id} 
                            className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium">
                                  {sale.table_number ? `Mesa ${sale.table_number}` : 'Domicilio'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {sale.payment_method}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(sale.created_at)} • {sale.sale_items.length} productos
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(sale.total_amount)}</p>
                              </div>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSale(sale)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySalesView;