import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGasData } from '@/hooks/useGasData';
import { supabase } from '@/integrations/supabase/client';
import GasRouteMap from './GasRouteMap';
import GasFlowmeterPanel from './GasFlowmeterPanel';
import GasMermaAnalysis from './GasMermaAnalysis';
import { FuturisticCard, AICard } from '@/components/ui/FuturisticCard';
import { 
  Flame, 
  Truck, 
  MapPin, 
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Bot,
  Loader2,
  Sparkles,
  Map,
  Brain,
  Shield,
  TrendingUp,
  Zap,
  Eye,
  Gauge,
  TrendingDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Temporary Mapbox token for demo - in production this should come from secrets
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsczF4eHhwMjBicGsyaXBpY3A1NW1mbWoifQ.demo';

const GasDashboardGerencia: React.FC = () => {
  const { 
    inventorySummary, 
    activeRoutes, 
    anomalies, 
    clients,
    isLoading 
  } = useGasData();

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiModules, setAiModules] = useState({
    copilot: true,
    auditor: true,
    predictions: false,
  });

  const routesInProgress = activeRoutes.filter(r => r.status === 'in_progress').length;
  const routesPending = activeRoutes.filter(r => r.status === 'pending_return_review').length;
  const newAnomalies = anomalies.filter(a => a.status === 'new').length;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  const handleAISummary = async (queryType: string = 'daily_summary') => {
    setIsLoadingAI(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .single();

      const { data, error } = await supabase.functions.invoke('gas-ai-copilot', {
        body: { 
          tenantId: profile?.restaurant_id,
          queryType 
        }
      });

      if (error) throw error;
      setAiResponse(data.response);
    } catch (error) {
      console.error('Error fetching AI summary:', error);
      setAiResponse('No se pudo obtener el resumen. Intenta de nuevo.');
    } finally {
      setIsLoadingAI(false);
    }
  };

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
          <p className="text-muted-foreground">Operación en tiempo real • Ibagué, Tolima</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAnomalies > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalAnomalies} Crítica{criticalAnomalies > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            En línea
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background/50 border border-border/30">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="w-4 h-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Map className="w-4 h-4" />
            Mapa en Vivo
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="w-4 h-4" />
            Inteligencia IA
          </TabsTrigger>
          <TabsTrigger value="flowmeters" className="gap-2">
            <Gauge className="w-4 h-4" />
            Caudalímetros IoT
          </TabsTrigger>
          <TabsTrigger value="merma" className="gap-2">
            <TrendingDown className="w-4 h-4" />
            Análisis Merma
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FuturisticCard glowColor="orange">
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
            </FuturisticCard>

            <FuturisticCard glowColor="cyan">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">Gas en Ruta</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {inventorySummary?.total_in_vehicles.toLocaleString() || 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                </p>
              </CardContent>
            </FuturisticCard>

            <FuturisticCard glowColor="green">
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
            </FuturisticCard>

            <FuturisticCard glowColor={newAnomalies > 0 ? 'red' : 'purple'} isActive={newAnomalies > 0}>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${newAnomalies > 0 ? 'text-red-400' : 'text-muted-foreground'} mb-2`}>
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Alertas</span>
                </div>
                <p className={`text-2xl font-bold ${newAnomalies > 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {newAnomalies}
                </p>
              </CardContent>
            </FuturisticCard>
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Active Routes */}
            <FuturisticCard glowColor="cyan" className="p-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-400" />
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
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          route.status === 'in_progress' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' :
                          route.status === 'pending_return_review' ? 'bg-yellow-400' :
                          route.status === 'closed' ? 'bg-gray-400' :
                          'bg-cyan-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{route.route_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.vehicle?.plate || 'Sin vehículo'} • {route.vehicle?.driver_name || 'Sin conductor'}
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
            </FuturisticCard>

            {/* Anomalies */}
            <FuturisticCard glowColor={newAnomalies > 0 ? 'red' : 'purple'} className="p-0">
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
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20 hover:bg-background/80 transition-colors"
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
                          anomaly.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' :
                          anomaly.status === 'new' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        }`}
                      >
                        {anomaly.severity === 'critical' ? 'Crítica' :
                         anomaly.status === 'new' ? 'Nueva' : 'En revisión'}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </FuturisticCard>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <FuturisticCard glowColor="purple">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </CardContent>
            </FuturisticCard>
            <FuturisticCard glowColor="green">
              <CardContent className="p-4 text-center">
                <Truck className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{routesInProgress}</p>
                <p className="text-sm text-muted-foreground">Rutas activas</p>
              </CardContent>
            </FuturisticCard>
            <FuturisticCard glowColor="orange">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{routesPending}</p>
                <p className="text-sm text-muted-foreground">Pendientes revisión</p>
              </CardContent>
            </FuturisticCard>
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="space-y-6">
          <FuturisticCard glowColor="cyan" className="p-0 overflow-hidden">
            <GasRouteMap 
              mapboxToken={MAPBOX_TOKEN}
              className="h-[600px]"
            />
          </FuturisticCard>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          {/* AI Section Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">INTELIGENCIA ARTIFICIAL</h2>
              <p className="text-sm text-muted-foreground">Módulos de IA activos para tu operación</p>
            </div>
          </div>

          {/* AI Module Cards - Like reference image */}
          <div className="grid md:grid-cols-3 gap-4">
            <AICard
              title="IA Conektao"
              description="Resúmenes operativos diarios, análisis de rendimiento y alertas inteligentes."
              icon={<Bot className="w-6 h-6" />}
              isEnabled={aiModules.copilot}
              onToggle={() => setAiModules(prev => ({ ...prev, copilot: !prev.copilot }))}
            />
            <AICard
              title="Auditor IA"
              description="Detección automática de anomalías, fraudes y desviaciones operativas."
              icon={<Shield className="w-6 h-6" />}
              isEnabled={aiModules.auditor}
              onToggle={() => setAiModules(prev => ({ ...prev, auditor: !prev.auditor }))}
            />
            <AICard
              title="Predictor IA"
              description="Proyecciones de demanda, optimización de rutas y recomendaciones proactivas."
              icon={<TrendingUp className="w-6 h-6" />}
              isEnabled={aiModules.predictions}
              isPremium
              onToggle={() => setAiModules(prev => ({ ...prev, predictions: !prev.predictions }))}
            />
          </div>

          {/* AI Copilot Response Card */}
          <FuturisticCard glowColor="purple" className="p-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Copiloto IA
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAISummary('daily_summary')}
                    disabled={isLoadingAI}
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  >
                    {isLoadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                    Resumen
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAISummary('recommendations')}
                    disabled={isLoadingAI}
                    className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    Recomendaciones
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAISummary('anomalies')}
                    disabled={isLoadingAI}
                    className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                  >
                    Anomalías
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {aiResponse ? (
                <div className="p-4 rounded-lg bg-background/50 border border-purple-500/20">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-purple-400/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Haz clic en "Resumen" para obtener un análisis de la operación del día
                  </p>
                </div>
              )}
            </CardContent>
          </FuturisticCard>
        </TabsContent>

        {/* Flowmeters IoT Tab */}
        <TabsContent value="flowmeters" className="space-y-6">
          <GasFlowmeterPanel />
        </TabsContent>

        {/* Merma Analysis Tab */}
        <TabsContent value="merma" className="space-y-6">
          <GasMermaAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GasDashboardGerencia;
