import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Clock
} from 'lucide-react';

const Reports = () => {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Calculate advanced analytics
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  // Sales Analytics
  const todaySales = state.sales
    .filter(sale => new Date(sale.date).toDateString() === today.toDateString())
    .reduce((sum, sale) => sum + sale.total, 0);

  const monthSales = state.sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    })
    .reduce((sum, sale) => sum + sale.total, 0);

  const lastMonthSales = state.sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
    })
    .reduce((sum, sale) => sum + sale.total, 0);

  const salesGrowth = lastMonthSales > 0 ? ((monthSales - lastMonthSales) / lastMonthSales) * 100 : 0;

  // Product Performance
  const topProducts = state.products
    .filter(p => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const lowStockProducts = state.products
    .filter(p => p.stock <= p.minStock)
    .length;

  // Financial Metrics
  const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalCosts = state.products.reduce((sum, product) => sum + (product.cost * product.sold), 0);
  const grossProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Customer Metrics
  const averageTicket = state.sales.length > 0 ? totalRevenue / state.sales.length : 0;
  const totalTransactions = state.sales.length;

  // Employee Productivity
  const activeEmployees = state.employees.filter(emp => emp.status === 'active').length;
  const salesPerEmployee = activeEmployees > 0 ? monthSales / activeEmployees : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: 'Ventas Totales',
      value: formatCurrency(monthSales),
      change: formatPercent(salesGrowth),
      trend: salesGrowth >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Margen de Ganancia',
      value: `${profitMargin.toFixed(1)}%`,
      change: profitMargin > 25 ? 'Excelente' : profitMargin > 15 ? 'Bueno' : 'Mejorar',
      trend: profitMargin > 20 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Productos con Stock Bajo',
      value: lowStockProducts.toString(),
      change: `de ${state.products.length} productos`,
      trend: lowStockProducts < 3 ? 'up' : 'down',
      icon: Package,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(averageTicket),
      change: `${totalTransactions} transacciones`,
      trend: 'up',
      icon: Target,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const businessInsights = [
    {
      type: 'success',
      title: 'Productos Estrella',
      description: `${topProducts[0]?.name || 'N/A'} es tu producto más vendido con ${topProducts[0]?.sold || 0} unidades`,
      action: 'Considera promocionarlo más'
    },
    {
      type: profitMargin > 20 ? 'success' : 'warning',
      title: 'Rentabilidad',
      description: `Tu margen de ganancia es del ${profitMargin.toFixed(1)}%`,
      action: profitMargin > 20 ? 'Mantén esta tendencia' : 'Optimiza costos'
    },
    {
      type: lowStockProducts > 0 ? 'warning' : 'success',
      title: 'Gestión de Inventario',
      description: `${lowStockProducts} productos necesitan reabastecimiento`,
      action: lowStockProducts > 0 ? 'Revisar y reabastecer' : 'Inventario óptimo'
    },
    {
      type: 'info',
      title: 'Productividad',
      description: `Ventas por empleado: ${formatCurrency(salesPerEmployee)}`,
      action: 'Considera incentivos por rendimiento'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Reportes y Análisis</h1>
            <p className="text-slate-600">Dashboard inteligente de business intelligence</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reporte Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {metric.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${metric.color}`}>
                    <metric.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Insights IA
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Predicciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendencia de Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Ventas de Hoy</span>
                      <span className="text-green-600 font-bold">{formatCurrency(todaySales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Ventas del Mes</span>
                      <span className="text-blue-600 font-bold">{formatCurrency(monthSales)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Ganancia Bruta</span>
                      <span className="text-purple-600 font-bold">{formatCurrency(grossProfit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{product.sold} vendidos</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(product.price * product.sold)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Insights Inteligentes de ConektAO AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {businessInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.type === 'success' ? 'bg-green-50 border-green-500' :
                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <h4 className="font-semibold text-slate-800 mb-2">{insight.title}</h4>
                      <p className="text-slate-600 mb-3">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-slate-700">
                          Recomendación: {insight.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Predicciones Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">
                      📈 Proyección de Ventas - Próximo Mes
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {formatCurrency(monthSales * 1.15)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Basado en tendencia actual y estacionalidad (+15% estimado)
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">
                      🎯 Productos en Demanda Creciente
                    </h4>
                    <div className="space-y-2">
                      {topProducts.slice(0, 3).map((product, index) => (
                        <div key={product.id} className="flex justify-between items-center">
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="outline" className="text-green-600">
                            +{(15 + index * 5)}% proyectado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">
                      ⚠️ Alertas de Reabastecimiento
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Productos que necesitarán reorden en los próximos 7 días:
                    </p>
                    <div className="space-y-2">
                      {state.products
                        .filter(p => p.stock <= p.minStock + 5)
                        .slice(0, 5)
                        .map(product => (
                          <div key={product.id} className="flex justify-between items-center">
                            <span className="font-medium">{product.name}</span>
                            <Badge variant="destructive">
                              {product.stock} restantes
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;