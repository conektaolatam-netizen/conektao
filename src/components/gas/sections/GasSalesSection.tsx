import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  TrendingUp, 
  Users, 
  Truck, 
  MapPin, 
  Clock,
  CheckCircle2,
  DollarSign,
  Flame,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGasData } from '@/hooks/useGasData';
import { useFlowmeterData } from '@/hooks/useFlowmeterData';

interface GasSalesSectionProps {
  onBack: () => void;
}

const GasSalesSection: React.FC<GasSalesSectionProps> = ({ onBack }) => {
  const { inventorySummary, activeRoutes, clients, isLoading } = useGasData();
  const { todaySummary } = useFlowmeterData();

  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress').length;
  const completedRoutes = activeRoutes.filter(r => r.status === 'closed').length;
  const pendingRoutes = activeRoutes.filter(r => r.status === 'pending_return_review').length;

  // Calculate estimated sales based on flowmeter data
  const pricePerKg = 3200; // COP per kg
  const totalKgDispatched = (todaySummary?.tanks_kg || 0) + (todaySummary?.pipetas_kg || 0);
  const totalFillings = (todaySummary?.tanks_count || 0) + (todaySummary?.pipetas_count || 0);
  const estimatedSales = totalKgDispatched * pricePerKg;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card border border-border/30 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-secondary" />
            Ventas y Entregas
          </h1>
          <p className="text-muted-foreground">Seguimiento de rutas y facturación</p>
        </div>
      </div>

      {/* Today's Sales Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Ventas del Día</h3>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            Hoy
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              ${(estimatedSales / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-muted-foreground">Facturado (est.)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary">
              {totalKgDispatched.toLocaleString() || (inventorySummary?.total_delivered_today || 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">kg Despachados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{totalFillings}</p>
            <p className="text-sm text-muted-foreground">Llenados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{completedRoutes}</p>
            <p className="text-sm text-muted-foreground">Rutas Cerradas</p>
          </div>
        </div>
      </motion.div>

      {/* Sales Breakdown by Product */}
      {todaySummary && (todaySummary.tanks_count > 0 || todaySummary.pipetas_count > 0) && (
        <Card className="border-2 border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Desglose por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stationary Tanks */}
            {todaySummary.tanks_count > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Tanques Estacionarios
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(todaySummary.tanks_by_size || {}).map(([size, data]) => {
                    const tankData = data as { count: number; total_kg: number };
                    if (tankData.count === 0) return null;
                    return (
                      <div key={size} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                        <p className="text-lg font-bold text-purple-400">{tankData.count}</p>
                        <p className="text-xs text-muted-foreground">{size} gal</p>
                        <p className="text-xs text-purple-300">{tankData.total_kg.toLocaleString()} kg</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Small Pipetas */}
            {todaySummary.pipetas_count > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Pipetas Pequeñas (20-100kg)
                </h4>
                <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{todaySummary.pipetas_count}</p>
                    <p className="text-sm text-muted-foreground">Unidades llenadas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-300">{todaySummary.pipetas_kg.toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground">Total despachado</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Route Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">En Ruta</Badge>
            </div>
            <p className="text-4xl font-bold text-green-400">{routesInProgress}</p>
            <p className="text-sm text-muted-foreground">Rutas en progreso</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>
            </div>
            <p className="text-4xl font-bold text-yellow-400">{pendingRoutes}</p>
            <p className="text-sm text-muted-foreground">Por revisar retorno</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/30 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <Badge variant="secondary">Cerradas</Badge>
            </div>
            <p className="text-4xl font-bold text-foreground">{completedRoutes}</p>
            <p className="text-sm text-muted-foreground">Rutas completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Routes List */}
      <Card className="border-2 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-secondary" />
            Rutas Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeRoutes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay rutas programadas para hoy
            </div>
          ) : (
            activeRoutes.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    route.status === 'in_progress' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' :
                    route.status === 'pending_return_review' ? 'bg-yellow-400' :
                    route.status === 'closed' ? 'bg-muted-foreground' :
                    'bg-cyan-400'
                  }`} />
                  <div>
                    <p className="font-bold text-foreground">{route.route_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {route.vehicle?.plate || 'Sin vehículo'} • {route.vehicle?.driver_name || 'Sin conductor'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={`${
                    route.status === 'in_progress' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    route.status === 'pending_return_review' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    route.status === 'closed' ? 'bg-muted text-muted-foreground' :
                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {route.status === 'in_progress' ? 'En ruta' :
                   route.status === 'pending_return_review' ? 'Pendiente' :
                   route.status === 'closed' ? 'Cerrada' :
                   route.status === 'planned' ? 'Planificada' : route.status}
                </Badge>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Clients Summary */}
      <Card className="border-2 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Clientes Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground">{clients.length}</p>
              <p className="text-muted-foreground">Total de clientes registrados</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GasSalesSection;
