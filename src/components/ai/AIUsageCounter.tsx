import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  MessageCircle, 
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsageData {
  limits: {
    plan_type: string;
    daily_limit: number;
    current_usage: number;
    additional_credits: number;
    reset_date: string;
  };
  usage_today: {
    total_questions: number;
    by_type: {
      chat: number;
      analysis: number;
      recommendation: number;
    };
    cost_by_type: {
      chat: number;
      analysis: number;
      recommendation: number;
    };
    total_cost_usd: number;
    remaining: number;
  };
  pricing: {
    basic: { daily_limit: number; price_cop: number; price_usd: number };
    premium: { daily_limit: number; price_cop: number; price_usd: number };
    enterprise: { daily_limit: number; price_cop: number; price_usd: number };
    additional_credit_cop: number;
    additional_credit_usd: number;
  };
}

const AIUsageCounter: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsageData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUsageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsageData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-usage-control', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: { action: 'get_usage' }
      });

      if (error) throw error;
      setUsageData(data);
    } catch (err) {
      console.error('Error loading usage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = async (credits: number = 5) => {
    setIsAddingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-usage-control', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: { 
          action: 'add_credits',
          additional_credits: credits
        }
      });

      if (error) throw error;

      toast({
        title: "Créditos agregados",
        description: `Se agregaron ${credits} créditos adicionales a tu cuenta`,
      });

      loadUsageData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudieron agregar los créditos",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-pulse text-muted-foreground">Cargando datos de uso...</div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const { limits, usage_today, pricing } = usageData;
  const totalAllowed = limits.daily_limit + limits.additional_credits;
  const usagePercentage = (limits.current_usage / totalAllowed) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = limits.current_usage >= totalAllowed;

  const formatCurrency = (amount: number, currency: 'COP' | 'USD' = 'COP') => {
    return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 6 : 0,
      maximumFractionDigits: currency === 'USD' ? 6 : 0,
    }).format(amount);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'enterprise': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Uso de IA
          </div>
          <Badge 
            variant="secondary" 
            className={`${getPlanColor(limits.plan_type)} text-white`}
          >
            Plan {limits.plan_type.charAt(0).toUpperCase() + limits.plan_type.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Consultas utilizadas hoy
            </span>
            <span className={`text-sm font-bold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
              {limits.current_usage} / {totalAllowed}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`}
          />
          {isNearLimit && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Te estás acercando al límite diario</span>
            </div>
          )}
        </div>

        {/* Usage Breakdown */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/10 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">Chat</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{usage_today.by_type.chat}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(usage_today.cost_by_type.chat, 'USD')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Análisis</span>
            </div>
            <p className="text-lg font-bold text-green-600">{usage_today.by_type.analysis}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(usage_today.cost_by_type.analysis, 'USD')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium">Recom.</span>
            </div>
            <p className="text-lg font-bold text-purple-600">{usage_today.by_type.recommendation}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(usage_today.cost_by_type.recommendation, 'USD')}
            </p>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
          <span className="font-semibold">Costo total hoy:</span>
          <span className="font-bold text-primary">
            {formatCurrency(usage_today.total_cost_usd, 'USD')}
          </span>
        </div>

        {/* Action Buttons */}
        {isAtLimit ? (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Límite alcanzado</span>
              </div>
              <p className="text-sm text-red-600">
                Has usado todas tus consultas diarias. Puedes comprar créditos adicionales o actualizar tu plan.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAddCredits(5)}
                disabled={isAddingCredits}
                variant="outline"
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                +5 Créditos
                <span className="ml-1 text-xs">
                  ({formatCurrency(pricing.additional_credit_cop * 5)})
                </span>
              </Button>
              
              <Button
                onClick={() => handleAddCredits(10)}
                disabled={isAddingCredits}
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                +10 Créditos
                <span className="ml-1 text-xs">
                  ({formatCurrency(pricing.additional_credit_cop * 10)})
                </span>
              </Button>
            </div>
          </div>
        ) : isNearLimit ? (
          <Button
            onClick={() => handleAddCredits(5)}
            disabled={isAddingCredits}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Comprar 5 créditos adicionales ({formatCurrency(pricing.additional_credit_cop * 5)})
          </Button>
        ) : null}

        {/* Plan Info */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="flex justify-between">
            <span>Plan actual: {limits.plan_type}</span>
            <span>Resetea: {new Date(limits.reset_date).toLocaleDateString()}</span>
          </div>
          {limits.additional_credits > 0 && (
            <div className="mt-1">
              Créditos adicionales: {limits.additional_credits}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIUsageCounter;