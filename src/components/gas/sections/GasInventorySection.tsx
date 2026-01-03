import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Flame, Truck, Factory, TrendingDown, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGasData, PlantInventory } from '@/hooks/useGasData';

interface GasInventorySectionProps {
  onBack: () => void;
}

const PlantCard: React.FC<{ plant: PlantInventory; index: number }> = ({ plant, index }) => {
  const isLowStock = plant.utilization_percent < 30;
  const isHighStock = plant.utilization_percent >= 80;
  
  const getStockColor = () => {
    if (isLowStock) return 'text-red-400';
    if (isHighStock) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getProgressColor = () => {
    if (isLowStock) return 'bg-red-500';
    if (isHighStock) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getPlantType = (name: string) => {
    if (name.toLowerCase().includes('mayorista')) return { label: 'Mayorista', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    if (name.toLowerCase().includes('minorista')) return { label: 'Minorista', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    return { label: 'Satélite', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  };

  const plantType = getPlantType(plant.plant_name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-5 rounded-2xl border-2 border-border/30 bg-gradient-to-br from-card to-card/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Factory className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">{plant.plant_name}</h3>
            <Badge variant="outline" className={plantType.color}>
              {plantType.label}
            </Badge>
          </div>
        </div>
        {isLowStock && (
          <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Stock bajo</span>
          </div>
        )}
      </div>

      {plant.location_text && (
        <div className="flex items-start gap-2 mb-4 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{plant.location_text}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Stock actual</span>
          <span className={`text-2xl font-bold ${getStockColor()}`}>
            {plant.current_stock.toLocaleString()} kg
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidad</span>
            <span className="font-medium text-foreground">{plant.capacity.toLocaleString()} kg</span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${Math.min(plant.utilization_percent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilización</span>
            <span className={`font-bold ${getStockColor()}`}>{plant.utilization_percent}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GasInventorySection: React.FC<GasInventorySectionProps> = ({ onBack }) => {
  const { inventorySummary, plantsInventory, isLoadingPlantsInventory } = useGasData();

  const totalCapacity = plantsInventory.reduce((sum, p) => sum + p.capacity, 0);
  const totalStock = plantsInventory.reduce((sum, p) => sum + p.current_stock, 0);
  const totalUtilization = totalCapacity > 0 ? Math.round(totalStock / totalCapacity * 100) : 0;

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
            <Package className="w-7 h-7 text-primary" />
            Inventarios
          </h1>
          <p className="text-muted-foreground">Control de gas y stock en tiempo real</p>
        </div>
      </div>

      {/* Plants Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Factory className="w-5 h-5 text-muted-foreground" />
          Plantas de Almacenamiento
        </h2>
        
        {isLoadingPlantsInventory ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : plantsInventory.length === 0 ? (
          <Card className="border-2 border-border/30">
            <CardContent className="p-8 text-center">
              <Factory className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay plantas configuradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {plantsInventory.map((plant, index) => (
              <PlantCard key={plant.plant_id} plant={plant} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Total Overview */}
      <Card className="border-2 border-border/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Inventario Total Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-3xl font-bold text-primary">{totalStock.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">kg en Plantas</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary/10 border border-secondary/20">
              <p className="text-3xl font-bold text-secondary">
                {(inventorySummary?.total_in_vehicles || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">kg en Vehículos</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-3xl font-bold text-green-400">
                {(totalStock + (inventorySummary?.total_in_vehicles || 0)).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">kg Total Disponible</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted border border-border/30">
              <p className="text-3xl font-bold text-foreground">{totalUtilization}%</p>
              <p className="text-sm text-muted-foreground">Utilización Global</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Movement */}
      <Card className="border-2 border-border/30">
        <CardHeader>
          <CardTitle>Movimiento del Día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">Entregado Hoy</p>
                <p className="text-sm text-muted-foreground">Despachos completados</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-green-500/10 text-green-400 border-green-500/30">
              {(inventorySummary?.total_delivered_today || 0).toLocaleString()} kg
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-2xl font-bold text-foreground">{plantsInventory.length}</p>
              <p className="text-sm text-muted-foreground">Plantas Activas</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-2xl font-bold text-foreground">{totalCapacity.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">kg Capacidad Total</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-2xl font-bold text-foreground">{inventorySummary?.total_delivered_today || 0}</p>
              <p className="text-sm text-muted-foreground">Despachos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GasInventorySection;
