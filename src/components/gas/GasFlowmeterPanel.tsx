import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FuturisticCard } from '@/components/ui/FuturisticCard';
import { useFlowmeterData, useFlowmeterSimulation } from '@/hooks/useFlowmeterData';
import { 
  Gauge, 
  Thermometer, 
  Droplets,
  Truck,
  Cylinder,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  Zap,
  ArrowRight,
  Timer
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MeterCardProps {
  meterId: string;
  location: string;
  icon: React.ReactNode;
  glowColor: 'orange' | 'cyan' | 'green' | 'purple';
  reading: {
    volume_liters?: number;
    volume_kg?: number | null;
    temperature?: number | null;
    pressure?: number | null;
    reading_at?: string;
    variance_percent?: number | null;
    cylinder_serial?: string | null;
    is_anomaly?: boolean;
  } | null;
  extraInfo?: React.ReactNode;
}

const MeterCard: React.FC<MeterCardProps> = ({ 
  meterId, 
  location, 
  icon, 
  glowColor, 
  reading,
  extraInfo 
}) => {
  const isOnline = reading && new Date(reading.reading_at || '').getTime() > Date.now() - 300000; // 5 min
  
  return (
    <FuturisticCard glowColor={glowColor} className="relative overflow-hidden">
      <CardContent className="p-4">
        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${isOnline 
              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {isOnline ? 'En línea' : 'Inactivo'}
          </Badge>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            glowColor === 'orange' ? 'bg-orange-500/20 text-orange-400' :
            glowColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
            glowColor === 'green' ? 'bg-green-500/20 text-green-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {icon}
          </div>
          <div>
            <p className="font-bold text-sm">{meterId}</p>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>

        {/* Main reading */}
        {reading ? (
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {reading.volume_kg 
                  ? `${reading.volume_kg.toLocaleString()} kg`
                  : `${reading.volume_liters?.toLocaleString()} L`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                hace {formatDistanceToNow(new Date(reading.reading_at || ''), { locale: es })}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {reading.temperature && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Thermometer className="w-3 h-3" />
                  <span>{reading.temperature.toFixed(1)}°C</span>
                </div>
              )}
              {reading.pressure && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Gauge className="w-3 h-3" />
                  <span>{reading.pressure.toFixed(1)} bar</span>
                </div>
              )}
            </div>

            {/* Extra info */}
            {extraInfo}

            {/* Anomaly indicator */}
            {reading.is_anomaly && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">Anomalía detectada</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        )}
      </CardContent>
    </FuturisticCard>
  );
};

const GasFlowmeterPanel: React.FC = () => {
  const { latestReadings, todaySummary, isLoading, refetch } = useFlowmeterData();
  const { 
    isSimulating, 
    startSimulation, 
    stopSimulation, 
    simulateTankerTrip,
    generatePipetaReading,
    lastPipetaTime 
  } = useFlowmeterSimulation();

  return (
    <div className="space-y-6">
      {/* Header with simulation controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Caudalímetros IoT</h2>
            <p className="text-sm text-muted-foreground">Monitoreo en tiempo real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateTankerTrip}
            className="gap-2"
          >
            <Truck className="w-4 h-4" />
            Simular Viaje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePipetaReading}
            className="gap-2"
          >
            <Cylinder className="w-4 h-4" />
            + Pipeta
          </Button>
          <Button
            variant={isSimulating ? "destructive" : "default"}
            size="sm"
            onClick={isSimulating ? stopSimulation : startSimulation}
            className="gap-2"
          >
            {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Detener' : 'Auto-simular'}
          </Button>
        </div>
      </div>

      {/* Simulation status */}
      {isSimulating && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Zap className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-sm text-green-400">
            Simulación activa - generando pipetas cada 8-15 segundos
          </span>
          {lastPipetaTime && (
            <span className="text-xs text-muted-foreground ml-auto">
              Última: {formatDistanceToNow(lastPipetaTime, { locale: es, addSuffix: true })}
            </span>
          )}
        </div>
      )}

      {/* 3 Meter Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <MeterCard
          meterId="M1 - Puerto Salgar"
          location="Planta Principal"
          icon={<Droplets className="w-5 h-5" />}
          glowColor="orange"
          reading={latestReadings.M1}
          extraInfo={
            latestReadings.M1?.vehicle_plate && (
              <div className="text-xs text-muted-foreground">
                🚛 {latestReadings.M1.vehicle_plate} • {latestReadings.M1.driver_name}
              </div>
            )
          }
        />
        
        <MeterCard
          meterId="M2 - Ibagué"
          location="Estacionario"
          icon={<Gauge className="w-5 h-5" />}
          glowColor="cyan"
          reading={latestReadings.M2}
          extraInfo={
            latestReadings.M2?.variance_percent !== null && latestReadings.M2?.variance_percent !== undefined && (
              <div className={`flex items-center gap-2 text-xs ${
                latestReadings.M2.variance_percent > 1 ? 'text-red-400' : 'text-green-400'
              }`}>
                {latestReadings.M2.variance_percent > 1 
                  ? <AlertTriangle className="w-3 h-3" /> 
                  : <CheckCircle2 className="w-3 h-3" />
                }
                Merma: {latestReadings.M2.variance_percent.toFixed(2)}%
              </div>
            )
          }
        />
        
        <MeterCard
          meterId="M3 - Pipetas"
          location="Llenado"
          icon={<Cylinder className="w-5 h-5" />}
          glowColor="green"
          reading={latestReadings.M3}
          extraInfo={
            latestReadings.M3?.cylinder_serial && (
              <div className="text-xs text-muted-foreground">
                🏷️ Serie: {latestReadings.M3.cylinder_serial}
              </div>
            )
          }
        />
      </div>

      {/* Daily Flow Summary */}
      <FuturisticCard glowColor="purple" className="p-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            Flujo del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySummary ? (
            <div className="space-y-4">
              {/* Flow visualization */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background/50 border border-border/20">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Puerto Salgar</p>
                  <p className="text-xl font-bold text-orange-400">
                    {todaySummary.sent_liters.toLocaleString()} L
                  </p>
                  <p className="text-xs text-muted-foreground">enviados</p>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className={`text-sm font-medium ${todaySummary.merma_percent > 1 ? 'text-red-400' : 'text-green-400'}`}>
                        {todaySummary.merma_liters.toFixed(0)} L ({todaySummary.merma_percent.toFixed(2)}%)
                      </p>
                      <p className="text-xs text-muted-foreground">merma en tránsito</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Ibagué</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {todaySummary.received_liters.toLocaleString()} L
                  </p>
                  <p className="text-xs text-muted-foreground">recibidos</p>
                </div>
              </div>

              {/* Pipetas summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Cylinder className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">Pipetas llenadas</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{todaySummary.pipetas_count} unidades</p>
                  <p className="text-xs text-muted-foreground">{todaySummary.pipetas_kg.toFixed(0)} kg despachados</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
        </CardContent>
      </FuturisticCard>
    </div>
  );
};

export default GasFlowmeterPanel;
