import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Flame, Truck, Factory, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGasData } from '@/hooks/useGasData';

interface GasInventorySectionProps {
  onBack: () => void;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  trend?: 'up' | 'down' | null;
}> = ({ icon, label, value, sublabel, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-5 rounded-2xl border-2 border-border/30 bg-gradient-to-br ${color} backdrop-blur-sm`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
      )}
    </div>
    <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
    <p className="text-sm font-medium text-foreground/80">{label}</p>
    {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
  </motion.div>
);

const GasInventorySection: React.FC<GasInventorySectionProps> = ({ onBack }) => {
  const { inventorySummary, isLoading } = useGasData();

  const totalGas = (inventorySummary?.total_in_plant || 0) + (inventorySummary?.total_in_vehicles || 0);

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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={<Flame className="w-6 h-6 text-primary" />}
          label="Gas en Planta"
          value={`${(inventorySummary?.total_in_plant || 0).toLocaleString()} kg`}
          sublabel="Puerto Salgar + Ibagué"
          color="from-primary/15 to-primary/5"
          trend="up"
        />
        <StatCard
          icon={<Truck className="w-6 h-6 text-secondary" />}
          label="Gas en Vehículos"
          value={`${(inventorySummary?.total_in_vehicles || 0).toLocaleString()} kg`}
          sublabel="En ruta de distribución"
          color="from-secondary/15 to-secondary/5"
        />
      </div>

      {/* Total Overview */}
      <Card className="border-2 border-border/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-muted-foreground" />
            Inventario Total Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-4xl font-bold text-foreground">{totalGas.toLocaleString()} kg</p>
              <p className="text-muted-foreground">Total de GLP disponible</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{Math.round((inventorySummary?.total_in_plant || 0) / totalGas * 100)}%</p>
                <p className="text-xs text-muted-foreground">En planta</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                <p className="text-2xl font-bold text-secondary">{Math.round((inventorySummary?.total_in_vehicles || 0) / totalGas * 100)}%</p>
                <p className="text-xs text-muted-foreground">En ruta</p>
              </div>
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

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-xl bg-card border border-border/30">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Recepciones</p>
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
