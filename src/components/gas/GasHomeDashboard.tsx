import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  Brain, 
  Map,
  AlertTriangle,
  Truck,
  Flame,
  ChevronRight,
  Key
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGasData } from '@/hooks/useGasData';
import GasRouteMap from './GasRouteMap';
import GasInventorySection from './sections/GasInventorySection';
import GasSalesSection from './sections/GasSalesSection';
import GasAISection from './sections/GasAISection';
import GasSmartMermaSection from './sections/GasSmartMermaSection';

const MAPBOX_STORAGE_KEY = 'conektao_mapbox_token';

type ActiveSection = 'home' | 'inventory' | 'sales' | 'ai' | 'smartMerma';

interface AppButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: 'orange' | 'teal' | 'purple' | 'cyan';
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  onClick: () => void;
}

const AppButton: React.FC<AppButtonProps> = ({ 
  icon, label, sublabel, color, badge, badgeVariant = 'secondary', onClick 
}) => {
  const colorStyles = {
    orange: {
      bg: 'from-primary/20 to-primary/5',
      border: 'border-primary/30 hover:border-primary/60',
      icon: 'text-primary',
      glow: 'hover:shadow-[0_0_30px_hsl(25_100%_50%/0.3)]'
    },
    teal: {
      bg: 'from-secondary/20 to-secondary/5',
      border: 'border-secondary/30 hover:border-secondary/60',
      icon: 'text-secondary',
      glow: 'hover:shadow-[0_0_30px_hsl(180_100%_27%/0.3)]'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30 hover:border-purple-500/60',
      icon: 'text-purple-400',
      glow: 'hover:shadow-[0_0_30px_hsl(270_70%_50%/0.3)]'
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      icon: 'text-cyan-400',
      glow: 'hover:shadow-[0_0_30px_hsl(190_90%_50%/0.3)]'
    }
  };

  const styles = colorStyles[color];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-2xl border-2 transition-all duration-300
        bg-gradient-to-br ${styles.bg} ${styles.border} ${styles.glow}
        backdrop-blur-sm group cursor-pointer
      `}
    >
      {/* Badge */}
      {badge !== undefined && (
        <Badge 
          variant={badgeVariant}
          className="absolute top-3 right-3 text-xs"
        >
          {badge}
        </Badge>
      )}

      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center mb-4 mx-auto ${styles.icon}`}>
        {icon}
      </div>

      {/* Label */}
      <h3 className="text-lg font-bold text-foreground mb-1">{label}</h3>
      {sublabel && (
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      )}

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className={`w-5 h-5 ${styles.icon}`} />
      </div>
    </motion.button>
  );
};

const QuickStatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const GasHomeDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem(MAPBOX_STORAGE_KEY) || '';
  });
  const [tokenInput, setTokenInput] = useState('');
  
  const { 
    inventorySummary, 
    activeRoutes, 
    anomalies,
    isLoading 
  } = useGasData();

  const newAnomalies = anomalies.filter(a => a.status === 'new').length;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress').length;

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem(MAPBOX_STORAGE_KEY, tokenInput.trim());
      setMapboxToken(tokenInput.trim());
      setTokenInput('');
    }
  };

  // If a section is active, render that section
  if (activeSection === 'inventory') {
    return <GasInventorySection onBack={() => setActiveSection('home')} />;
  }
  if (activeSection === 'sales') {
    return <GasSalesSection onBack={() => setActiveSection('home')} />;
  }
  if (activeSection === 'ai') {
    return <GasAISection onBack={() => setActiveSection('home')} />;
  }
  if (activeSection === 'smartMerma') {
    return <GasSmartMermaSection onBack={() => setActiveSection('home')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground">Operación en tiempo real • Ibagué, Tolima</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAnomalies > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalAnomalies} Crítica{criticalAnomalies > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            <div className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse" />
            En línea
          </Badge>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStatCard
          icon={<Flame className="w-5 h-5 text-primary" />}
          value={`${(inventorySummary?.total_in_plant || 0).toLocaleString()} kg`}
          label="Gas en Planta"
          color="bg-primary/10"
        />
        <QuickStatCard
          icon={<Truck className="w-5 h-5 text-secondary" />}
          value={`${(inventorySummary?.total_in_vehicles || 0).toLocaleString()} kg`}
          label="Gas en Ruta"
          color="bg-secondary/10"
        />
        <QuickStatCard
          icon={<Map className="w-5 h-5 text-cyan-400" />}
          value={routesInProgress}
          label="Rutas Activas"
          color="bg-cyan-500/10"
        />
        <QuickStatCard
          icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
          value={newAnomalies}
          label="Alertas"
          color="bg-yellow-500/10"
        />
      </div>

      {/* Main App Buttons - Large and Clear */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppButton
          icon={<Package className="w-8 h-8" />}
          label="Inventarios"
          sublabel="Control de gas y stock"
          color="orange"
          badge={inventorySummary?.total_in_plant ? `${Math.round(inventorySummary.total_in_plant / 1000)}k kg` : undefined}
          onClick={() => setActiveSection('inventory')}
        />
        <AppButton
          icon={<TrendingUp className="w-8 h-8" />}
          label="Ventas"
          sublabel="Entregas y facturación"
          color="teal"
          badge={`${inventorySummary?.total_delivered_today || 0} kg hoy`}
          onClick={() => setActiveSection('sales')}
        />
        <AppButton
          icon={<Brain className="w-8 h-8" />}
          label="Inteligencia IA"
          sublabel="Análisis y predicciones"
          color="purple"
          badge="Activo"
          onClick={() => setActiveSection('ai')}
        />
      </div>

      {/* Smart Merma Button - Single unified section */}
      <AppButton
        icon={<Brain className="w-7 h-7" />}
        label="Análisis Inteligente de Merma"
        sublabel="Caudalímetros IoT + Control de pérdidas · 12 vehículos"
        color="cyan"
        badge={newAnomalies > 0 ? newAnomalies : '3 plantas'}
        badgeVariant={newAnomalies > 0 ? 'destructive' : 'secondary'}
        onClick={() => setActiveSection('smartMerma')}
      />

      {/* Large Map Section */}
      <div className="rounded-2xl border-2 border-border/30 overflow-hidden bg-card/30">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Mapa en Vivo</h3>
              <p className="text-sm text-muted-foreground">{routesInProgress} rutas activas en tiempo real</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            <div className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse" />
            Actualizando
          </Badge>
        </div>
        
        {/* Map or Token Input */}
        {mapboxToken ? (
          <div className="h-[400px] md:h-[500px]">
            <GasRouteMap 
              mapboxToken={mapboxToken}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="h-[400px] md:h-[500px] flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Configura tu Mapa</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Ingresa tu token público de Mapbox para visualizar las rutas en tiempo real.
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  Obtén tu token aquí →
                </a>
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="pk.eyJ1Ijoi..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="flex-1 bg-background/50"
                />
                <Button 
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GasHomeDashboard;
