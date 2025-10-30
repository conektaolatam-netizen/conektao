import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  Users,
  ChefHat,
  Calculator,
  Download,
  Share2,
  Eye,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';

interface IncomePresentationProps {
  userData: any;
  onClose: () => void;
}

const IncomePresentation: React.FC<IncomePresentationProps> = ({ userData, onClose }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'projections'>('summary');

  // Datos realistas basados en $190M mensuales - DÍA 23 del mes
  const incomeData = {
    // Ventas acumuladas hasta día 23
    monthly: 147200000, // 77% de $190M completado
    daily: 6890000, // Hoy (día fuerte)
    dailyAverage: 6333333, // Promedio diario
    weeklyAverage: 44333333,
    annual: 2280000000, // Proyección anual
    
    // Impuestos y cálculos (sobre ventas del mes actual)
    impoconsumo: 11776000, // 8% sobre $147.2M
    iva: 27968000, // 19% sobre $147.2M
    retenciones: 2944000, // 2% sobre $147.2M
    netIncome: 104512000, // Después de impuestos
    
    // Métricas operativas (hoy)
    averageTicket: 48500,
    dailyOrders: 142,
    monthlyGrowth: 18.5, // vs mes anterior
    yearlyGrowth: 28.3,
    
    // Métricas del mes hasta día 23
    totalOrders: 3034, // 142 órdenes promedio x 23 días
    daysRemaining: 7,
    
    // Breakdown por categorías (basado en datos reales que mostraste)
    breakdown: {
      pizzas: { amount: 88320000, percentage: 60 }, // 60% de $147.2M
      bebidas: { amount: 29440000, percentage: 20 }, // 20% de $147.2M
      adiciones: { amount: 14720000, percentage: 10 }, // 10% de $147.2M
      entradas: { amount: 8832000, percentage: 6 }, // 6% de $147.2M
      postres: { amount: 5888000, percentage: 4 } // 4% de $147.2M
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const renderSummaryView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Ingresos principales */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">
            {formatCurrency(incomeData.monthly)}
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Ventas acumuladas día 23/30 - {userData?.companyName || 'Tu Restaurante'}
          </CardDescription>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-semibold">+{incomeData.monthlyGrowth}% vs mes anterior</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800">77% completado</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-800">{formatCurrency(incomeData.daily)}</div>
            <div className="text-sm text-blue-600">Promedio diario</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-800">{formatCurrency(incomeData.annual)}</div>
            <div className="text-sm text-purple-600">Proyección anual</div>
          </CardContent>
        </Card>
      </div>

      {/* Operaciones */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-800">{formatNumber(incomeData.dailyOrders)}</div>
            <div className="text-sm text-orange-600">Órdenes diarias</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-6 text-center">
            <ChefHat className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-teal-800">{formatCurrency(incomeData.averageTicket)}</div>
            <div className="text-sm text-teal-600">Ticket promedio</div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por categorías */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribución de ingresos por categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(incomeData.breakdown).map(([category, data]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold capitalize">{category}</span>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(data.amount)}</div>
                    <div className="text-sm text-muted-foreground">{data.percentage}%</div>
                  </div>
                </div>
                <Progress value={data.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailedView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Impuestos y deducciones */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Análisis fiscal mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 font-semibold">IMPOCONSUMO (8%)</div>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(incomeData.impoconsumo)}</div>
              <div className="text-sm text-red-600">Obligatorio restaurantes</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-orange-800 font-semibold">IVA (19%)</div>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(incomeData.iva)}</div>
              <div className="text-sm text-orange-600">Sobre servicios</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800 font-semibold">Retenciones (2%)</div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(incomeData.retenciones)}</div>
              <div className="text-sm text-yellow-600">Clientes corporativos</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-semibold">Ingreso Neto</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(incomeData.netIncome)}</div>
              <div className="text-sm text-green-600">Después de impuestos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tendencias */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Crecimiento y tendencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <div className="font-semibold">Crecimiento mensual</div>
              <div className="text-sm text-muted-foreground">Comparado con mes anterior</div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-800">+{incomeData.monthlyGrowth}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="font-semibold">Crecimiento anual</div>
              <div className="text-sm text-muted-foreground">Comparado con año anterior</div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-800">+{incomeData.yearlyGrowth}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs operativos */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs Operativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Órdenes/día</span>
            <span className="font-bold">{formatNumber(incomeData.dailyOrders)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ticket promedio</span>
            <span className="font-bold">{formatCurrency(incomeData.averageTicket)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ingresos/m²</span>
            <span className="font-bold">{formatCurrency(Math.round(incomeData.monthly / 100))}</span>
          </div>
          <div className="flex justify-between">
            <span>Rotación mesas</span>
            <span className="font-bold">3.2x/día</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectionsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Proyecciones financieras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-blue-800 font-semibold mb-2">Próximo trimestre</div>
              <div className="text-3xl font-bold text-blue-900">{formatCurrency(incomeData.monthly * 3 * 1.125)}</div>
              <div className="text-sm text-blue-600">+12.5% proyectado</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-800 font-semibold mb-2">Próximo semestre</div>
              <div className="text-3xl font-bold text-green-900">{formatCurrency(incomeData.monthly * 6 * 1.15)}</div>
              <div className="text-sm text-green-600">+15% proyectado</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="text-purple-800 font-semibold mb-2">Próximo año</div>
              <div className="text-3xl font-bold text-purple-900">{formatCurrency(incomeData.annual * 1.283)}</div>
              <div className="text-sm text-purple-600">+28.3% proyectado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades de crecimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="font-semibold text-green-800">Delivery optimizado</div>
            <div className="text-sm text-green-600">+15% ingresos potenciales</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="font-semibold text-blue-800">Horarios extendidos</div>
            <div className="text-sm text-blue-600">+8% ingresos potenciales</div>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <div className="font-semibold text-purple-800">Nuevos productos</div>
            <div className="text-sm text-purple-600">+12% ingresos potenciales</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas ContAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="font-semibold text-orange-800">Pago IMPOCONSUMO</div>
            <div className="text-sm text-orange-600">Vence en 8 días - {formatCurrency(incomeData.impoconsumo)}</div>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="font-semibold text-red-800">Declaración mensual</div>
            <div className="text-sm text-red-600">Preparar para el 15 del mes</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Reporte de Ingresos
            </h1>
            <p className="text-muted-foreground mt-2">
              {userData?.companyName || 'Tu Restaurante'} • Datos en tiempo real
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
            <Button onClick={onClose}>
              <Eye className="mr-2 h-4 w-4" />
              Volver al sistema
            </Button>
          </div>
        </div>

        {/* Navegación de vistas */}
        <div className="flex gap-2 mb-8">
          <Button 
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            onClick={() => setViewMode('summary')}
          >
            <Activity className="mr-2 h-4 w-4" />
            Resumen Ejecutivo
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Análisis Detallado
          </Button>
          <Button 
            variant={viewMode === 'projections' ? 'default' : 'outline'}
            onClick={() => setViewMode('projections')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Proyecciones
          </Button>
        </div>

        {/* Contenido según vista */}
        <div className="animate-fade-in">
          {viewMode === 'summary' && renderSummaryView()}
          {viewMode === 'detailed' && renderDetailedView()}
          {viewMode === 'projections' && renderProjectionsView()}
        </div>

        {/* Footer con timestamp */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Generado el {new Date().toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default IncomePresentation;