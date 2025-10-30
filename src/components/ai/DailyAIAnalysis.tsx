import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisData {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  peakHours: number[];
  topProducts: [string, { quantity: number; revenue: number }][];
  paymentMethods: { [key: string]: number };
}

interface AIAnalysisResponse {
  analysis: string;
  data: AnalysisData;
  tokens_used: number;
  cost_usd: number;
  remaining_queries: number;
}

const DailyAIAnalysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyzeToday = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-analysis', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        if (error.status === 429) {
          setError('Has alcanzado tu límite diario de análisis IA. Considera actualizar tu plan o comprar créditos adicionales.');
          toast({
            title: "Límite alcanzado",
            description: "Has usado todas tus consultas diarias de IA",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      setAnalysis(data);
      toast({
        title: "Análisis completado",
        description: "Se ha generado el análisis de ventas del día",
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Error al generar el análisis';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Análisis IA - Ventas del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Obtén un análisis detallado de las ventas de hoy con insights y recomendaciones personalizadas
            </p>
            <Button 
              onClick={handleAnalyzeToday}
              disabled={isAnalyzing}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analizar Ventas de Hoy
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Error en el análisis</h4>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Ventas Totales</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(analysis.data.totalSales)}
                </p>
              </div>
              <div className="bg-secondary/10 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Órdenes</h4>
                <p className="text-2xl font-bold">{analysis.data.totalOrders}</p>
              </div>
              <div className="bg-accent/10 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Ticket Promedio</h4>
                <p className="text-2xl font-bold">
                  {formatCurrency(analysis.data.averageTicket)}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis IA
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis.analysis}
                </p>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Peak Hours */}
              {analysis.data.peakHours.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Horarios Pico</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.data.peakHours.map((hour) => (
                      <Badge key={hour} variant="secondary">
                        {formatHour(hour)} - {formatHour(hour + 1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Products */}
              {analysis.data.topProducts.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Productos Top</h4>
                  <div className="space-y-2">
                    {analysis.data.topProducts.slice(0, 3).map(([name, data], index) => (
                      <div key={name} className="flex justify-between items-center text-sm">
                        <span className="truncate">{index + 1}. {name}</span>
                        <div className="flex gap-2 text-muted-foreground">
                          <span>{data.quantity} unids.</span>
                          <span>{formatCurrency(data.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Usage Info */}
            <div className="text-xs text-muted-foreground border-t pt-4 flex justify-between items-center">
              <div>
                Consultas restantes hoy: <span className="font-semibold">{analysis.remaining_queries}</span>
              </div>
              <div>
                Tokens usados: {analysis.tokens_used} • Costo: ${analysis.cost_usd.toFixed(6)} USD
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleAnalyzeToday}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Análisis'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyAIAnalysis;