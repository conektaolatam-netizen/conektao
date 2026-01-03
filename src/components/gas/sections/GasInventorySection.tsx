import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Flame, Truck, Factory, TrendingUp, MapPin, AlertTriangle, Zap, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGasData, PlantInventory } from '@/hooks/useGasData';
interface GasInventorySectionProps {
  onBack: () => void;
}

// Configuración visual por tipo de planta
const PLANT_CONFIGS: Record<string, {
  gradient: string;
  icon: string;
  glow: string;
  badge: string;
  ring: string;
}> = {
  mayorista: {
    gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    ring: 'ring-purple-500/30'
  },
  minorista: {
    gradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    ring: 'ring-blue-500/30'
  },
  satelite: {
    gradient: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    icon: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    ring: 'ring-cyan-500/30'
  }
};
const getPlantConfig = (name: string) => {
  if (name.toLowerCase().includes('mayorista')) return {
    type: 'Mayorista',
    config: PLANT_CONFIGS.mayorista
  };
  if (name.toLowerCase().includes('minorista')) return {
    type: 'Minorista',
    config: PLANT_CONFIGS.minorista
  };
  return {
    type: 'Satélite',
    config: PLANT_CONFIGS.satelite
  };
};
const PlantCard: React.FC<{
  plant: PlantInventory;
  index: number;
}> = ({
  plant,
  index
}) => {
  const {
    type,
    config
  } = getPlantConfig(plant.plant_name);
  const isLowStock = plant.utilization_percent < 30;
  const isCritical = plant.utilization_percent < 15;
  const isOverflow = plant.utilization_percent > 100;

  // Conversión: 1 kg de GLP ≈ 0.527 galones (densidad ~1.9 kg/galón)
  const KG_TO_GALLON = 0.527;
  
  // Formatear a galones
  const formatGallons = (kgValue: number) => {
    const gallons = kgValue * KG_TO_GALLON;
    if (gallons >= 1000) return `${(gallons / 1000).toFixed(1)}k gal`;
    return `${gallons.toLocaleString('es-CO', { maximumFractionDigits: 0 })} gal`;
  };
  return <motion.div initial={{
    opacity: 0,
    scale: 0.95,
    y: 20
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} transition={{
    delay: index * 0.1,
    duration: 0.4
  }} className={`relative overflow-hidden rounded-3xl border border-border/40 bg-card ring-1 ${config.ring} shadow-xl ${config.glow}`}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />
      
      {/* Glow Effect */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${config.icon} opacity-10 blur-3xl`} />

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${config.icon} flex items-center justify-center shadow-lg`}>
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground text-lg leading-tight">{plant.plant_name}</h3>
              <Badge variant="outline" className={`${config.badge} text-xs font-semibold`}>
                {type}
              </Badge>
            </div>
          </div>
          {(isLowStock || isCritical) && <motion.div animate={{
          scale: [1, 1.1, 1]
        }} transition={{
          repeat: Infinity,
          duration: 2
        }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold">{isCritical ? 'Crítico' : 'Bajo'}</span>
            </motion.div>}
        </div>

        {/* Location */}
        {plant.location_text && <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <span className="line-clamp-2">{plant.location_text}</span>
          </div>}

        {/* Stock Display */}
        <div className="space-y-4">
          {/* Main Stock */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stock Actual</p>
              <p className={`text-4xl font-black ${isLowStock ? 'text-red-400' : isOverflow ? 'text-orange-400' : 'text-foreground'}`}>
                {formatGallons(plant.current_stock)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capacidad</p>
              <p className="text-xl font-bold text-muted-foreground">
                {formatGallons(plant.capacity)}
              </p>
            </div>
          </div>

          {/* Progress Bar - Futuristic Style */}
          <div className="space-y-2">
            <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden border border-border/30">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)'
            }} />
              
              {/* Progress Fill */}
              <motion.div initial={{
              width: 0
            }} animate={{
              width: `${Math.min(plant.utilization_percent, 100)}%`
            }} transition={{
              duration: 1,
              delay: index * 0.1 + 0.3,
              ease: "easeOut"
            }} className={`absolute left-0 top-0 h-full rounded-full ${isCritical ? 'bg-gradient-to-r from-red-600 to-red-400' : isLowStock ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : isOverflow ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-green-600 to-green-400'}`} />
              
              {/* Shine Effect */}
              <motion.div initial={{
              x: '-100%'
            }} animate={{
              x: '200%'
            }} transition={{
              duration: 2,
              delay: index * 0.2,
              repeat: Infinity,
              repeatDelay: 3
            }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Percentage */}
            <div className="flex items-center justify-center">
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${isCritical ? 'bg-red-500/20 text-red-400' : isLowStock ? 'bg-yellow-500/20 text-yellow-400' : isOverflow ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                <Zap className="w-3 h-3 inline mr-1" />
                {plant.utilization_percent}% utilizado
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>;
};
const GasInventorySection: React.FC<GasInventorySectionProps> = ({
  onBack
}) => {
  const {
    inventorySummary,
    plantsInventory,
    isLoadingPlantsInventory
  } = useGasData();
  const totalCapacity = plantsInventory.reduce((sum, p) => sum + p.capacity, 0);
  const totalStock = plantsInventory.reduce((sum, p) => sum + p.current_stock, 0);
  const totalUtilization = totalCapacity > 0 ? Math.round(totalStock / totalCapacity * 100) : 0;
  return <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-card border border-border/30 flex items-center justify-center hover:bg-accent transition-all hover:scale-105">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            Inventarios
          </h1>
          <p className="text-muted-foreground mt-1">Control de gas en tiempo real</p>
        </div>
      </div>

      {/* Plants Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <Factory className="w-6 h-6 text-muted-foreground" />
            Plantas de Almacenamiento
          </h2>
          <Badge variant="secondary" className="text-sm">
            {plantsInventory.length} plantas activas
          </Badge>
        </div>
        
        {isLoadingPlantsInventory ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-3xl bg-muted animate-pulse" />)}
          </div> : plantsInventory.length === 0 ? <Card className="border-2 border-dashed border-border/50">
            <CardContent className="p-12 text-center">
              <Factory className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground">No hay plantas configuradas</p>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plantsInventory.map((plant, index) => <PlantCard key={plant.plant_id} plant={plant} index={index} />)}
          </div>}
      </div>

      {/* Consolidated Stats */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.4
    }} className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Inventario Consolidado</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Conversión kg a galones */}
            {(() => {
              const KG_TO_GALLON = 0.527;
              const vehiclesGal = (inventorySummary?.total_in_vehicles || 0) * KG_TO_GALLON;
              const totalGal = (totalStock + (inventorySummary?.total_in_vehicles || 0)) * KG_TO_GALLON;
              return (
                <>
                  <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 text-center">
                    <Truck className="w-6 h-6 mx-auto mb-2 text-secondary" />
                    <p className="text-3xl font-black text-secondary">
                      {(vehiclesGal / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Galones en Vehículos</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    <p className="text-3xl font-black text-green-400">
                      {(totalGal / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Galones Disponibles</p>
                  </div>
                </>
              );
            })()}
            <div className="p-5 rounded-2xl bg-muted border border-border/30 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-foreground" />
              <p className="text-3xl font-black text-foreground">{totalUtilization}%</p>
              <p className="text-xs text-muted-foreground mt-1">Utilización</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily Movement */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.5
    }}>
        <Card className="border border-border/40 overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Movimiento del Día
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Entregado Hoy</p>
                  <p className="text-sm text-muted-foreground">Despachos completados</p>
                </div>
              </div>
              <div className="text-right">
                {(() => {
                  const KG_TO_GALLON = 0.527;
                  const deliveredGal = (inventorySummary?.total_delivered_today || 0) * KG_TO_GALLON;
                  return (
                    <>
                      <p className="text-4xl font-black text-green-400">
                        {deliveredGal >= 1000 ? `${(deliveredGal / 1000).toFixed(1)}k` : deliveredGal.toFixed(0)} gal
                      </p>
                      <p className="text-xs text-muted-foreground">{deliveredGal.toLocaleString('es-CO', { maximumFractionDigits: 0 })} galones</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>;
};
export default GasInventorySection;