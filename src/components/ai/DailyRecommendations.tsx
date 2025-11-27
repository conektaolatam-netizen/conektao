import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown,
  TrendingUp,
  DollarSign,
  Target,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OpportunityProduct {
  name: string;
  price: number;
  cost: number;
  margin: number;
  marginPercent: number;
  today_qty: number;
  today_revenue: number;
  dailyChange: number;
}

interface RecommendationData {
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  data_context: {
    todayTotal: number;
    yesterdayTotal: number;
    dailyChange: number;
    opportunity?: {
      type: string;
      product: OpportunityProduct;
    };
    topProducts?: Array<{
      name: string;
      quantity: number;
      revenue: number;
      margin: number;
      marginPercent: number;
    }>;
  };
  recommendation_id: string;
  is_applied?: boolean;
}

interface DailyRecommendationsProps {
  onOpenChat?: (context: string) => void;
}

const DailyRecommendations: React.FC<DailyRecommendationsProps> = ({ onOpenChat }) => {
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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
        setRecommendation({
          recommendation: existingRecommendation.recommendation_text,
          priority: existingRecommendation.priority as 'low' | 'medium' | 'high',
          data_context: existingRecommendation.data_context as any,
          recommendation_id: existingRecommendation.id,
          is_applied: existingRecommendation.is_applied
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

      if (error) throw error;

      // Handle insufficient data case
      if (data.error === 'INSUFFICIENT_DATA') {
        setError(data.message);
        toast({
          title: "Datos insuficientes",
          description: data.message,
          variant: "default",
        });
        return;
      }

      setRecommendation(data);
      toast({
        title: "✨ Recomendación generada",
        description: "Análisis completo basado en tus datos reales",
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

  const handleImplementStrategy = () => {
    if (!recommendation || !onOpenChat) return;

    const opp = recommendation.data_context.opportunity;
    const context = opp ? `Ayúdame a implementar esta estrategia para ${opp.product.name}:

${recommendation.recommendation}

DATOS DEL PRODUCTO:
- Precio: $${opp.product.price?.toLocaleString()}
- Costo: $${opp.product.cost?.toFixed(0).toLocaleString()}
- Margen: $${opp.product.margin?.toFixed(0).toLocaleString()} (${opp.product.marginPercent?.toFixed(1)}%)
- Ventas hoy: ${opp.product.today_qty} unidades
- Cambio vs ayer: ${opp.product.dailyChange >= 0 ? '+' : ''}${opp.product.dailyChange?.toFixed(1)}%

Necesito un plan detallado con:
1. ✍️ Textos exactos para publicaciones en redes sociales
2. 📱 Estrategia de contenido (historias, posts, reels)
3. 🎯 Segmento de público objetivo
4. ⏰ Horarios óptimos de publicación
5. 📊 KPIs para medir el éxito
6. 💰 Presupuesto (si aplica)` : `Ayúdame a implementar esta recomendación:

${recommendation.recommendation}

Necesito un plan práctico y ejecutable.`;

    onOpenChat(context);
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
        title: "✅ Estrategia marcada",
        description: "Has marcado esta recomendación como aplicada",
      });
    } catch (err) {
      console.error('Error marking as applied:', err);
    }
  };

  const getEmotionalColor = (type?: string) => {
    if (!type) return 'from-primary/20 to-secondary/20';
    
    const colorMap: Record<string, string> = {
      'at_risk_high_margin': 'from-red-500/20 to-orange-500/20',
      'trending_up': 'from-green-500/20 to-emerald-500/20',
      'low_margin': 'from-yellow-500/20 to-amber-500/20',
      'low_stock_high_demand': 'from-purple-500/20 to-pink-500/20',
    };
    
    return colorMap[type] || 'from-primary/20 to-secondary/20';
  };

  const getTypeEmoji = (type?: string) => {
    const emojiMap: Record<string, string> = {
      'at_risk_high_margin': '📉',
      'trending_up': '📈',
      'low_margin': '💸',
      'low_stock_high_demand': '⚠️',
    };
    
    return emojiMap[type || ''] || '💡';
  };

  const getTypeLabel = (type?: string) => {
    const labelMap: Record<string, string> = {
      'at_risk_high_margin': 'Producto en Riesgo',
      'trending_up': 'Oportunidad de Crecimiento',
      'low_margin': 'Optimización de Margen',
      'low_stock_high_demand': 'Alerta de Inventario',
    };
    
    return labelMap[type || ''] || 'Recomendación General';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (error && !recommendation) {
    return (
      <Card className="w-full bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Conektao IA - Recomendaciones</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {error}
              </p>
            </div>
            <Button 
              onClick={generateNewRecommendation}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Intentar nuevamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation && !isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <div className="h-4 w-4 bg-accent rounded-full animate-ping" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Conektao IA - Recomendaciones</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Obtén estrategias de marketing personalizadas basadas en análisis profundo de tus productos, costos y márgenes reales
              </p>
            </div>
            <Button 
              onClick={generateNewRecommendation}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8 py-6"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generar Recomendación IA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h4 className="font-semibold text-lg">Analizando tu negocio...</h4>
              <p className="text-sm text-muted-foreground">
                Revisando productos, costos, márgenes y tendencias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) return null;

  const opp = recommendation.data_context.opportunity;
  const opportunityType = opp?.type;

  return (
    <Card className={`w-full bg-gradient-to-br ${getEmotionalColor(opportunityType)} border-2`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getTypeEmoji(opportunityType)}</span>
              <div>
                <h2 className="text-2xl font-bold">
                  {getTypeLabel(opportunityType)}
                  {opp && `: ${opp.product.name}`}
                </h2>
                <Badge 
                  variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}
                  className="mt-1"
                >
                  Prioridad {recommendation.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateNewRecommendation}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Data Section */}
        {opp && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Precio Actual</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(opp.product.price)}</p>
            </div>

            <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Costo Real</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(opp.product.cost)}</p>
            </div>

            <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Margen</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(opp.product.margin)}</p>
              <p className="text-xs text-muted-foreground">{opp.product.marginPercent.toFixed(1)}%</p>
            </div>

            <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                {opp.product.dailyChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground font-medium">Cambio Diario</p>
              </div>
              <p className={`text-xl font-bold ${opp.product.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {opp.product.dailyChange >= 0 ? '+' : ''}{opp.product.dailyChange.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{opp.product.today_qty} unidades hoy</p>
            </div>
          </div>
        )}

        {/* AI Recommendation - Full visible content */}
        <div className="bg-background/80 backdrop-blur rounded-lg p-6 border-2 border-primary/20">
          <div className="space-y-3">
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {recommendation.recommendation}
            </div>
          </div>
        </div>

        {/* Implementation CTA - Large and Prominent */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleImplementStrategy}
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity text-lg py-7 font-semibold shadow-lg"
          >
            <MessageCircle className="h-6 w-6 mr-2" />
            ✅ Implementar Estrategia IA
          </Button>

          <Button
            onClick={markAsApplied}
            disabled={recommendation.is_applied}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {recommendation.is_applied ? 'Estrategia aplicada' : 'Marcar como aplicada'}
          </Button>
        </div>

        {/* Collapsible Details - Only show if there are multiple top products */}
        {recommendation.data_context.topProducts && recommendation.data_context.topProducts.length > 1 && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails} className="border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                {showDetails ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                {showDetails ? 'Ocultar' : 'Ver'} otros productos destacados
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2 bg-background/40 rounded-lg p-4 border">
                {recommendation.data_context.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{product.quantity} uds</span>
                      <span className="hidden sm:inline">{formatCurrency(product.revenue)}</span>
                      <span className="text-green-600 font-medium">{product.marginPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer with daily summary */}
        <div className="pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
          <div>
            Ventas hoy: <span className="font-semibold text-foreground">
              {formatCurrency(recommendation.data_context.todayTotal)}
            </span>
          </div>
          <div className={recommendation.data_context.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
            {recommendation.data_context.dailyChange >= 0 ? '+' : ''}
            {recommendation.data_context.dailyChange.toFixed(1)}% vs ayer
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyRecommendations;
