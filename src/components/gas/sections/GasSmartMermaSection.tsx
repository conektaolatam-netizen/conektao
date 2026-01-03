import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuturisticCard } from '@/components/ui/FuturisticCard';
import { 
  Brain,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Star,
  Gauge,
  Activity,
  TrendingDown,
  ChevronRight,
  Zap,
  MapPin,
  User,
  Droplets
} from 'lucide-react';
import { GAS_VEHICLES, PLANTS, getVehiclesByPlant, getCriticalVehicles, getTotalFleetStats, type GasVehicle } from '@/data/gasVehiclesData';

interface GasSmartMermaSectionProps {
  onBack: () => void;
}

const StatusBadge: React.FC<{ status: GasVehicle['status'] }> = ({ status }) => {
  const config = {
    excellent: { label: 'Excelente', icon: Star, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    normal: { label: 'Normal', icon: CheckCircle2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    warning: { label: 'Alerta', icon: AlertTriangle, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    critical: { label: 'Crítico', icon: AlertTriangle, className: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' },
  };
  const { label, icon: Icon, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

const VehicleCard: React.FC<{ vehicle: GasVehicle }> = ({ vehicle }) => {
  const isCisterna = vehicle.vehicleType === 'cisterna';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border-2 transition-all ${
        vehicle.status === 'critical' ? 'border-red-500/50 bg-red-500/5' :
        vehicle.status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
        vehicle.status === 'excellent' ? 'border-green-500/30 bg-green-500/5' :
        'border-border/30 bg-card/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCisterna ? 'bg-purple-500/20' : 'bg-cyan-500/20'
          }`}>
            {isCisterna ? (
              <Droplets className="w-5 h-5 text-purple-400" />
            ) : (
              <Truck className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{vehicle.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {vehicle.driver}
            </p>
          </div>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-background/50">
          <p className={`text-lg font-bold ${
            vehicle.mermaPercent === 0 ? 'text-green-400' :
            vehicle.mermaPercent < 2 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {vehicle.mermaPercent}%
          </p>
          <p className="text-[10px] text-muted-foreground">Merma</p>
        </div>
        <div className="p-2 rounded-lg bg-background/50">
          <p className="text-lg font-bold text-foreground">{vehicle.todayTrips}</p>
          <p className="text-[10px] text-muted-foreground">Viajes</p>
        </div>
        <div className="p-2 rounded-lg bg-background/50">
          <p className="text-lg font-bold text-cyan-400">{(vehicle.todayLitersDelivered / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">Litros</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {vehicle.plantLabel}
        </span>
        <span className="text-muted-foreground">
          {isCisterna ? '🚛 Cisterna' : '🚚 Camión'}
        </span>
      </div>
    </motion.div>
  );
};

const PlantSection: React.FC<{ plant: keyof typeof PLANTS; vehicles: GasVehicle[] }> = ({ plant, vehicles }) => {
  const plantConfig = PLANTS[plant];
  const avgMerma = vehicles.reduce((sum, v) => sum + v.mermaPercent, 0) / vehicles.length;
  const totalLiters = vehicles.reduce((sum, v) => sum + v.todayLitersDelivered, 0);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            plantConfig.color === 'orange' ? 'bg-orange-500' :
            plantConfig.color === 'cyan' ? 'bg-cyan-500' : 'bg-purple-500'
          }`} />
          <h3 className="font-bold">{plantConfig.name}</h3>
          <Badge variant="outline">{vehicles.length} vehículos</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Merma prom: <span className={avgMerma > 2 ? 'text-red-400' : 'text-green-400'}>{avgMerma.toFixed(1)}%</span>
          </span>
          <span className="text-muted-foreground">
            Total: <span className="text-cyan-400">{(totalLiters / 1000).toFixed(1)}k L</span>
          </span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
};

const GasSmartMermaSection: React.FC<GasSmartMermaSectionProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const stats = getTotalFleetStats();
  const criticalVehicles = getCriticalVehicles();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Volver al inicio
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Análisis Inteligente de Merma</h1>
          <p className="text-sm text-muted-foreground">Caudalímetros IoT + Control de pérdidas • 12 vehículos en 3 plantas</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
            <Truck className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Flota Total</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.excellent}</p>
          <p className="text-xs text-muted-foreground">Sin Merma</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.withMerma}</p>
          <p className="text-xs text-muted-foreground">Con Merma</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.totalTrips}</p>
          <p className="text-xs text-muted-foreground">Viajes Hoy</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingDown className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold">{stats.avgMerma.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Merma Prom.</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalVehicles.length > 0 && (
        <FuturisticCard glowColor="orange" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-bold text-red-400">Vehículos con Merma Alta</span>
            <Badge variant="destructive">{criticalVehicles.length}</Badge>
          </div>
          <div className="space-y-2">
            {criticalVehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    <span className="text-sm text-muted-foreground">{v.driver}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{v.plantLabel}</span>
                  <Badge variant="destructive">{v.mermaPercent}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </FuturisticCard>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="ibague" className="gap-2">
            <MapPin className="w-4 h-4" />
            Ibagué
          </TabsTrigger>
          <TabsTrigger value="p1" className="gap-2">
            <MapPin className="w-4 h-4" />
            PS Planta 1
          </TabsTrigger>
          <TabsTrigger value="mayorista" className="gap-2">
            <MapPin className="w-4 h-4" />
            PS Mayorista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PlantSection plant="ibague" vehicles={getVehiclesByPlant('ibague')} />
          <PlantSection plant="puerto_salgar_p1" vehicles={getVehiclesByPlant('puerto_salgar_p1')} />
          <PlantSection plant="puerto_salgar_mayorista" vehicles={getVehiclesByPlant('puerto_salgar_mayorista')} />
        </TabsContent>

        <TabsContent value="ibague">
          <PlantSection plant="ibague" vehicles={getVehiclesByPlant('ibague')} />
        </TabsContent>

        <TabsContent value="p1">
          <PlantSection plant="puerto_salgar_p1" vehicles={getVehiclesByPlant('puerto_salgar_p1')} />
        </TabsContent>

        <TabsContent value="mayorista">
          <PlantSection plant="puerto_salgar_mayorista" vehicles={getVehiclesByPlant('puerto_salgar_mayorista')} />
        </TabsContent>
      </Tabs>

      {/* IoT Status Footer */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="font-medium">Caudalímetros IoT Activos</p>
              <p className="text-xs text-muted-foreground">M1 · M2 · M3 sincronizados en tiempo real</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <Zap className="w-3 h-3 mr-1" />
            12/12 En línea
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default GasSmartMermaSection;
