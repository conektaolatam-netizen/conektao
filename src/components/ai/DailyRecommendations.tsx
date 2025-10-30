import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecommendationData {
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  data_context: {
    dailyChange: number;
    weeklyChange: number;
    todayTotal: number;
    yesterdayTotal: number;
  };
  top_product_changes: Array<{
    name: string;
    change: number;
    today: number;
    yesterday: number;
  }>;
  recommendation_id: string;
}

interface DailyRecommendationsProps {
  onOpenChat?: (context: string) => void;
}

const DailyRecommendations: React.FC<DailyRecommendationsProps> = ({ onOpenChat }) => {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTodaysRecommendation();
  }, []);

  const loadTodaysRecommendation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.restaurant_id) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecommendation } = await supabase
        .from('ai_daily_recommendations')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRecommendation) {
        const dataContext = existingRecommendation.data_context as any;
        setRecommendation({
          recommendation: existingRecommendation.recommendation_text,
          priority: existingRecommendation.priority as 'low' | 'medium' | 'high',
          data_context: dataContext,
          top_product_changes: dataContext?.topProductChanges || dataContext?.top_product_changes || [],
          recommendation_id: existingRecommendation.id
        });
      }
    } catch (err) {
      console.error('Error loading recommendation:', err);
    }
  };

  const generateNewRecommendation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-recommendations', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setRecommendation(data);
      toast({
        title: "Recomendación generada",
        description: "Se ha creado una nueva recomendación basada en tus datos de ventas",
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Error al generar recomendación';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStrategy = () => {
    if (!recommendation) return;

    const context = `Ayúdame a implementar esta recomendación específica:

${recommendation.recommendation}

Contexto de ventas:
- Ventas de hoy: $${recommendation.data_context.todayTotal?.toLocaleString()} COP
- Ventas de ayer: $${recommendation.data_context.yesterdayTotal?.toLocaleString()} COP
- Cambio diario: ${recommendation.data_context.dailyChange >= 0 ? '+' : ''}${recommendation.data_context.dailyChange?.toFixed(1)}%

${recommendation.top_product_changes?.length > 0 ? 
  `Productos con cambios significativos:\n${recommendation.top_product_changes.map(p => 
    `- ${p.name}: ${p.change >= 0 ? '+' : ''}${p.change.toFixed(1)}% (${p.today} vs ${p.yesterday} unidades)`
  ).join('\n')}` : ''}

Necesito un plan detallado de implementación que incluya:
1. Acciones específicas paso a paso
2. Textos o contenido para promociones
3. Timing exacto de implementación  
4. Métricas para medir el éxito
5. Presupuesto estimado si aplica

¿Puedes ayudarme a desarrollar esta estrategia?`;

    if (onOpenChat) {
      onOpenChat(context);
    }
  };

  const markAsApplied = async () => {
    if (!recommendation?.recommendation_id) return;

    try {
      await supabase
        .from('ai_daily_recommendations')
        .update({ 
          is_applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', recommendation.recommendation_id);

      setRecommendation(prev => prev ? { ...prev, is_applied: true } : null);
      
      toast({
        title: "Recomendación marcada",
        description: "Has marcado esta recomendación como aplicada",
      });
    } catch (err) {
      console.error('Error marking as applied:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recomendación IA del Día
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewRecommendation}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Error</h4>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!recommendation && !isLoading && (
          <div className="text-center py-6">
            <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay recomendaciones para hoy. Genera una nueva basada en tus datos de ventas.
            </p>
            <Button onClick={generateNewRecommendation}>
              Generar Recomendación
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-6">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analizando tus datos de ventas...</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-4">
            {/* Priority and Context */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={`${getPriorityColor(recommendation.priority)} text-white`}
              >
                Prioridad {recommendation.priority.toUpperCase()}
              </Badge>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {recommendation.data_context?.dailyChange !== undefined && (
                  <div className="flex items-center gap-1">
                    {recommendation.data_context.dailyChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={recommendation.data_context.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {recommendation.data_context.dailyChange >= 0 ? '+' : ''}{recommendation.data_context.dailyChange.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Context */}
            {recommendation.data_context && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/10 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas Hoy</p>
                  <p className="font-semibold">{formatCurrency(recommendation.data_context.todayTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ventas Ayer</p>
                  <p className="font-semibold">{formatCurrency(recommendation.data_context.yesterdayTotal)}</p>
                </div>
              </div>
            )}

            {/* Main Recommendation */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Recomendación
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {recommendation.recommendation}
              </p>
            </div>

            {/* Product Changes */}
            {recommendation.top_product_changes?.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Productos con Cambios Significativos</h4>
                <div className="space-y-2">
                  {recommendation.top_product_changes.slice(0, 3).map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${product.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.change >= 0 ? '+' : ''}{product.change.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({product.today} vs {product.yesterday})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyStrategy}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ver cómo aplicar estrategia
              </Button>
              
              <Button 
                variant="outline" 
                onClick={markAsApplied}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Marcar como aplicada
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyRecommendations;