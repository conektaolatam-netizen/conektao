import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasData } from '@/hooks/useGasData';
import { 
  Flame, 
  Truck, 
  MapPin, 
  AlertTriangle,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const GasDashboardGerencia: React.FC = () => {
  const { 
    inventorySummary, 
    activeRoutes, 
    anomalies, 
    clients,
    isLoading 
  } = useGasData();

  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress').length;
  const routesPending = activeRoutes.filter(r => r.status === 'pending_return_review').length;
  const newAnomalies = anomalies.filter(a => a.status === 'new').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-card/50 border-border/30">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Gerencia</h1>
          <p className="text-muted-foreground">Resumen operativo del día</p>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          En línea
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gas Disponible */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">Gas en Planta</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {inventorySummary?.total_in_plant.toLocaleString() || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </CardContent>
        </Card>

        {/* Gas en Ruta */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Truck className="h-4 w-4" />
              <span className="text-sm font-medium">Gas en Ruta</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {inventorySummary?.total_in_vehicles.toLocaleString() || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </CardContent>
        </Card>

        {/* Entregas Hoy */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Entregado Hoy</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {inventorySummary?.total_delivered_today.toLocaleString() || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className={`border-${newAnomalies > 0 ? 'red' : 'border'}-500/20 ${newAnomalies > 0 ? 'bg-gradient-to-br from-red-500/10 to-red-600/5' : 'bg-card/50'}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 ${newAnomalies > 0 ? 'text-red-400' : 'text-muted-foreground'} mb-2`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Alertas</span>
            </div>
            <p className={`text-2xl font-bold ${newAnomalies > 0 ? 'text-red-400' : 'text-foreground'}`}>
              {newAnomalies}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Routes */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                Rutas del Día
              </CardTitle>
              <Badge variant="secondary">{activeRoutes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRoutes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay rutas programadas para hoy
              </p>
            ) : (
              activeRoutes.slice(0, 5).map(route => (
                <div 
                  key={route.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      route.status === 'in_progress' ? 'bg-green-400 animate-pulse' :
                      route.status === 'pending_return_review' ? 'bg-yellow-400' :
                      route.status === 'closed' ? 'bg-gray-400' :
                      'bg-blue-400'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{route.route_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {route.vehicle?.plate || 'Sin vehículo'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      route.status === 'in_progress' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      route.status === 'pending_return_review' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {route.status === 'in_progress' ? 'En ruta' :
                     route.status === 'pending_return_review' ? 'Pendiente revisión' :
                     route.status === 'planned' ? 'Planificada' :
                     route.status === 'closed' ? 'Cerrada' : route.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Anomalías Recientes
              </CardTitle>
              {newAnomalies > 0 && (
                <Badge variant="destructive">{newAnomalies} nuevas</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {anomalies.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Sin anomalías pendientes
                </p>
              </div>
            ) : (
              anomalies.slice(0, 5).map(anomaly => (
                <div 
                  key={anomaly.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      anomaly.severity === 'critical' ? 'bg-red-500/20' :
                      anomaly.severity === 'high' ? 'bg-orange-500/20' :
                      anomaly.severity === 'medium' ? 'bg-yellow-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        anomaly.severity === 'critical' ? 'text-red-400' :
                        anomaly.severity === 'high' ? 'text-orange-400' :
                        anomaly.severity === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{anomaly.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(anomaly.created_at).toLocaleTimeString('es-CO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      anomaly.status === 'new' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {anomaly.status === 'new' ? 'Nueva' : 'En revisión'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-sm text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{routesInProgress}</p>
            <p className="text-sm text-muted-foreground">Rutas activas</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{routesPending}</p>
            <p className="text-sm text-muted-foreground">Pendientes revisión</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GasDashboardGerencia;
