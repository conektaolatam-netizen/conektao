import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Brain, 
  Bot, 
  Shield, 
  TrendingUp,
  Sparkles,
  Loader2,
  Zap,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface GasAISectionProps {
  onBack: () => void;
}

interface AIModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  isEnabled: boolean;
  isPremium?: boolean;
  onToggle: () => void;
}

const AIModuleCard: React.FC<AIModuleCardProps> = ({
  icon, title, description, color, isEnabled, isPremium, onToggle
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
      isEnabled 
        ? `${color} shadow-lg` 
        : 'border-border/30 bg-card/50 opacity-70'
    }`}
    onClick={onToggle}
  >
    {isPremium && (
      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
        <Sparkles className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    )}
    <div className="flex items-start gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
        isEnabled ? 'bg-background/30' : 'bg-muted'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={`w-12 h-7 rounded-full transition-colors ${
        isEnabled ? 'bg-green-500' : 'bg-muted'
      } flex items-center ${isEnabled ? 'justify-end' : 'justify-start'} px-1`}>
        <div className="w-5 h-5 rounded-full bg-white shadow-md" />
      </div>
    </div>
  </motion.div>
);

const GasAISection: React.FC<GasAISectionProps> = ({ onBack }) => {
  const [aiModules, setAiModules] = useState({
    copilot: true,
    auditor: true,
    predictions: false,
  });
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

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
            <Brain className="w-7 h-7 text-purple-400" />
            Inteligencia Artificial
          </h1>
          <p className="text-muted-foreground">Módulos de IA activos para tu operación</p>
        </div>
      </div>

      {/* AI Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIModuleCard
          icon={<Bot className="w-7 h-7 text-purple-400" />}
          title="IA Conektao"
          description="Resúmenes operativos diarios, análisis de rendimiento y alertas inteligentes."
          color="border-purple-500/50 bg-purple-500/10"
          isEnabled={aiModules.copilot}
          onToggle={() => setAiModules(prev => ({ ...prev, copilot: !prev.copilot }))}
        />
        <AIModuleCard
          icon={<Shield className="w-7 h-7 text-cyan-400" />}
          title="Auditor IA"
          description="Detección automática de anomalías, fraudes y desviaciones operativas."
          color="border-cyan-500/50 bg-cyan-500/10"
          isEnabled={aiModules.auditor}
          onToggle={() => setAiModules(prev => ({ ...prev, auditor: !prev.auditor }))}
        />
        <AIModuleCard
          icon={<TrendingUp className="w-7 h-7 text-primary" />}
          title="Predictor IA"
          description="Proyecciones de demanda, optimización de rutas y recomendaciones."
          color="border-primary/50 bg-primary/10"
          isEnabled={aiModules.predictions}
          isPremium
          onToggle={() => setAiModules(prev => ({ ...prev, predictions: !prev.predictions }))}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Acciones Rápidas IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-background/50 hover:bg-purple-500/10 border-purple-500/30"
              onClick={() => handleAISummary('daily_summary')}
              disabled={isLoadingAI}
            >
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-xs">Resumen del día</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-background/50 hover:bg-cyan-500/10 border-cyan-500/30"
              onClick={() => handleAISummary('route_analysis')}
              disabled={isLoadingAI}
            >
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-xs">Análisis de rutas</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-background/50 hover:bg-primary/10 border-primary/30"
              onClick={() => handleAISummary('anomaly_detection')}
              disabled={isLoadingAI}
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs">Detectar anomalías</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-background/50 hover:bg-green-500/10 border-green-500/30"
              onClick={() => handleAISummary('recommendations')}
              disabled={isLoadingAI}
            >
              <Sparkles className="w-5 h-5 text-green-400" />
              <span className="text-xs">Recomendaciones</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Response Area */}
      <Card className="border-2 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            Respuesta de IA Conektao
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAI ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="text-muted-foreground">Analizando datos...</span>
            </div>
          ) : aiResponse ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20"
            >
              <p className="text-foreground whitespace-pre-wrap">{aiResponse}</p>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Selecciona una acción rápida para obtener un análisis inteligente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GasAISection;
