import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasData } from '@/hooks/useGasData';
import { 
  Truck, 
  MapPin, 
  Plus,
  Clock,
  CheckCircle2,
  Package,
  ArrowRight,
  Route
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const GasDashboardLogistica: React.FC = () => {
  const { 
    activeRoutes, 
    vehicles,
    plants,
    clients,
    isLoading 
  } = useGasData();

  const routesPlanned = activeRoutes.filter(r => r.status === 'planned');
  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress');
  const routesPendingReview = activeRoutes.filter(r => r.status === 'pending_return_review');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-card/50">
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
          <h1 className="text-2xl font-bold text-foreground">Panel de Logística</h1>
          <p className="text-muted-foreground">Gestión de rutas y entregas</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Route className="h-4 w-4" />
              <span className="text-sm font-medium">Planificadas</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{routesPlanned.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Truck className="h-4 w-4" />
              <span className="text-sm font-medium">En Ruta</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{routesInProgress.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Pendiente Revisión</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{routesPendingReview.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Vehículos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{vehicles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Routes List */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-400" />
            Rutas del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRoutes.length === 0 ? (
            <div className="text-center py-8">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No hay rutas programadas para hoy</p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear primera ruta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRoutes.map(route => (
                <div 
                  key={route.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/20 hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      route.status === 'in_progress' ? 'bg-green-400 animate-pulse' :
                      route.status === 'pending_return_review' ? 'bg-yellow-400' :
                      route.status === 'planned' ? 'bg-blue-400' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{route.route_number}</p>
                        <Badge variant="outline" className="text-xs">
                          {route.assigned_qty || 0} {route.assigned_unit}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {route.vehicle?.plate || 'Sin vehículo'} • {route.plant?.name || 'Sin planta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`${
                        route.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                        route.status === 'pending_return_review' ? 'bg-yellow-500/20 text-yellow-400' :
                        route.status === 'planned' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {route.status === 'in_progress' ? 'En ruta' :
                       route.status === 'pending_return_review' ? 'Revisar inventario' :
                       route.status === 'planned' ? 'Planificada' :
                       route.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vehicles */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-400" />
              Vehículos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay vehículos registrados
              </p>
            ) : (
              vehicles.slice(0, 5).map(vehicle => (
                <div 
                  key={vehicle.id}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{vehicle.plate}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {vehicle.capacity_value} {vehicle.capacity_unit}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Plants */}
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-400" />
              Plantas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plants.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay plantas registradas
              </p>
            ) : (
              plants.map(plant => (
                <div 
                  key={plant.id}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{plant.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {plant.location_text || 'Sin ubicación'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GasDashboardLogistica;
