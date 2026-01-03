import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  Brain, 
  Map,
  AlertTriangle,
  Truck,
  Flame,
  Key,
  Gauge
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
import GasAppButton from './ui/GasAppButton';

const MAPBOX_STORAGE_KEY = 'conektao_mapbox_token';

type ActiveSection = 'home' | 'inventory' | 'sales' | 'ai' | 'smartMerma';

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

      {/* Main App Buttons - Apple-like horizontal cards */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <GasAppButton
          icon={<TrendingUp className="w-6 h-6" />}
          title="Ventas"
          subtitle="Entregas y facturación"
          color="green"
          badge="27,840 gal"
          onClick={() => setActiveSection('sales')}
        />
        
        <GasAppButton
          icon={<Package className="w-6 h-6" />}
          title="Inventarios"
          subtitle="Gas en planta y stock"
          color="orange"
          badge={inventorySummary?.total_in_plant ? `${Math.round(inventorySummary.total_in_plant / 1000)}k kg` : undefined}
          onClick={() => setActiveSection('inventory')}
        />
        
        <GasAppButton
          icon={<Gauge className="w-6 h-6" />}
          title="Control de Merma"
          subtitle="Caudalímetros IoT · 12 vehículos"
          color="cyan"
          badge={newAnomalies > 0 ? newAnomalies : '3 plantas'}
          badgeVariant={newAnomalies > 0 ? 'destructive' : 'secondary'}
          onClick={() => setActiveSection('smartMerma')}
        />
        
        <GasAppButton
          icon={<Brain className="w-6 h-6" />}
          title="IA Conektao"
          subtitle="Tu copiloto de negocio"
          color="purple"
          badge="Activo"
          onClick={() => setActiveSection('ai')}
        />
      </motion.div>

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
