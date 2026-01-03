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
  Fuel,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGasData } from '@/hooks/useGasData';
import { 
  getPlantSummaries, 
  getTotalSalesStats, 
  SALES_PLANTS,
  getHighMermaDrivers
} from '@/data/gasSalesData';

interface GasSalesSectionProps {
  onBack: () => void;
}

const GasSalesSection: React.FC<GasSalesSectionProps> = ({ onBack }) => {
  const { activeRoutes, clients } = useGasData();

  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress').length;
  const completedRoutes = activeRoutes.filter(r => r.status === 'closed').length;
  const pendingRoutes = activeRoutes.filter(r => r.status === 'pending_return_review').length;

  // Get simulated sales data
  const totalStats = getTotalSalesStats();
  const plantSummaries = getPlantSummaries();
  const highMermaDrivers = getHighMermaDrivers();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

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
          <p className="text-muted-foreground">12 conductores · 3 plantas · Facturación del día</p>
        </div>
      </div>

      {/* Today's Sales Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Resumen Total del Día</h3>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            Hoy
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              {formatCurrency(totalStats.totalInvoiced)}
            </p>
            <p className="text-sm text-muted-foreground">Total Facturado</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary">
              {totalStats.totalGallons.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Galones Entregados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{totalStats.driverCount}</p>
            <p className="text-sm text-muted-foreground">Conductores Activos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{totalStats.totalMerma.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Galones Perdidos</p>
          </div>
        </div>
      </motion.div>

      {/* Sales by Plant */}
      <Card className="border-2 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Ventas por Planta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plantSummaries.map((plant, index) => {
            const plantConfig = SALES_PLANTS[plant.plantKey];
            return (
              <motion.div
                key={plant.plantKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${plantConfig.bgClass} border ${plantConfig.borderClass}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${plantConfig.bgClass} flex items-center justify-center`}>
                      <Building2 className={`w-5 h-5 ${plantConfig.textClass}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{plant.plant}</h4>
                      <p className="text-xs text-muted-foreground">{plant.driverCount} conductores</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${plantConfig.bgClass} ${plantConfig.textClass} ${plantConfig.borderClass}`}>
                    {formatCurrency(plant.totalInvoiced)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className={`text-lg font-bold ${plantConfig.textClass}`}>
                      {plant.totalGallons.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Galones</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${plant.avgMermaPercent > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {plant.avgMermaPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Merma Prom.</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${plant.totalMerma > 50 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {plant.totalMerma.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Gal. Perdidos</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* High Merma Alert */}
      {highMermaDrivers.length > 0 && (
        <Card className="border-2 border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Conductores con Merma Alta ({'>'}2%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highMermaDrivers.slice(0, 3).map((driver, index) => (
              <div 
                key={driver.id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{driver.driver}</p>
                    <p className="text-xs text-muted-foreground">{driver.plantLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400">{driver.mermaPercent}%</p>
                  <p className="text-xs text-muted-foreground">{driver.gallonsLost} gal perdidos</p>
                </div>
              </div>
            ))}
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
