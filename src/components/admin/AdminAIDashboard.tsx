import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, DollarSign, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalQuestions: number;
  totalCost: number;
  activeRestaurants: number;
  avgQuestionsPerRestaurant: number;
  mostUsedFunction: string;
  costByType: {
    chat: number;
    analysis: number;
    recommendation: number;
  };
}

const AdminAIDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's usage data
      const { data: usage } = await supabase
        .from('ai_usage_tracking')
        .select('question_type, cost_usd, restaurant_id')
        .eq('date', today);

      if (usage) {
        const totalQuestions = usage.length;
        const totalCost = usage.reduce((sum, item) => sum + Number(item.cost_usd), 0);
        const activeRestaurants = new Set(usage.map(item => item.restaurant_id)).size;
        
        const costByType = {
          chat: usage.filter(item => item.question_type === 'chat').reduce((sum, item) => sum + Number(item.cost_usd), 0),
          analysis: usage.filter(item => item.question_type === 'analysis').reduce((sum, item) => sum + Number(item.cost_usd), 0),
          recommendation: usage.filter(item => item.question_type === 'recommendation').reduce((sum, item) => sum + Number(item.cost_usd), 0)
        };

        const functionCounts = {
          chat: usage.filter(item => item.question_type === 'chat').length,
          analysis: usage.filter(item => item.question_type === 'analysis').length,
          recommendation: usage.filter(item => item.question_type === 'recommendation').length
        };

        const mostUsedFunction = Object.entries(functionCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        setStats({
          totalQuestions,
          totalCost,
          activeRestaurants,
          avgQuestionsPerRestaurant: activeRestaurants > 0 ? totalQuestions / activeRestaurants : 0,
          mostUsedFunction,
          costByType
        });
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-6">Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="text-center p-6">No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Panel Administrativo IA</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consultas Hoy</p>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Costo Total</p>
                <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restaurantes Activos</p>
                <p className="text-2xl font-bold">{stats.activeRestaurants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio por Restaurante</p>
                <p className="text-2xl font-bold">{stats.avgQuestionsPerRestaurant.toFixed(1)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso por Función</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold">Chat IA</h4>
              <p className="text-2xl font-bold text-blue-600">${stats.costByType.chat.toFixed(4)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold">Análisis</h4>
              <p className="text-2xl font-bold text-green-600">${stats.costByType.analysis.toFixed(4)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold">Recomendaciones</h4>
              <p className="text-2xl font-bold text-purple-600">${stats.costByType.recommendation.toFixed(4)}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <Badge variant="secondary">
              Función más usada: {stats.mostUsedFunction}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIDashboard;