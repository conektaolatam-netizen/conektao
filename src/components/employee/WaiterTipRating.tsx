import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WaiterRating {
  waiterId: string;
  waiterName: string;
  totalTips: number;
  salesCount: number;
  avgTipPerSale: number;
  rating: number; // 1-5 stars
}

const WaiterTipRating = () => {
  const { restaurant } = useAuth();
  const [ratings, setRatings] = useState<WaiterRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, [restaurant?.id]);

  const loadRatings = async () => {
    if (!restaurant?.id) return;

    try {
      // Get tip distributions from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: tipData, error } = await supabase
        .from('tip_distributions')
        .select(`
          id,
          total_tip_amount,
          distributed_by,
          sale_id,
          created_at
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('distributed_by', 'is', null);

      if (error) throw error;

      if (!tipData || tipData.length === 0) {
        setRatings([]);
        setLoading(false);
        return;
      }

      // Get user profiles for distributors
      const userIds = [...new Set(tipData.map(t => t.distributed_by).filter(Boolean))] as string[];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (!profiles || profiles.length === 0) {
        setRatings([]);
        setLoading(false);
        return;
      }

      // Calculate stats per waiter
      const waiterStats: Record<string, {
        name: string;
        totalTips: number;
        count: number;
      }> = {};

      tipData.forEach(tip => {
        const userId = tip.distributed_by;
        if (!userId) return;
        
        const profile = profiles.find(p => p.id === userId);
        if (!profile) return;

        if (!waiterStats[userId]) {
          waiterStats[userId] = {
            name: profile.full_name,
            totalTips: 0,
            count: 0
          };
        }

        waiterStats[userId].totalTips += (tip.total_tip_amount || 0);
        waiterStats[userId].count++;
      });

      // Convert to ratings array
      const ratingsArray: WaiterRating[] = Object.entries(waiterStats)
        .map(([waiterId, stats]) => {
          const avgTip = stats.count > 0 ? stats.totalTips / stats.count : 0;
          // Rating scale based on average tip per sale
          // 0-5000 = 1 star, 5000-10000 = 2 stars, 10000-15000 = 3 stars, 15000-25000 = 4 stars, 25000+ = 5 stars
          let rating = 1;
          if (avgTip >= 25000) rating = 5;
          else if (avgTip >= 15000) rating = 4;
          else if (avgTip >= 10000) rating = 3;
          else if (avgTip >= 5000) rating = 2;

          return {
            waiterId,
            waiterName: stats.name,
            totalTips: stats.totalTips,
            salesCount: stats.count,
            avgTipPerSale: avgTip,
            rating
          };
        })
        .filter(r => r.salesCount >= 3) // Only show waiters with at least 3 tip records
        .sort((a, b) => b.avgTipPerSale - a.avgTipPerSale);

      setRatings(ratingsArray);
    } catch (error) {
      console.error('Error loading waiter ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Calculando rendimiento...</span>
        </div>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-4">
          <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay suficientes datos de propinas aún
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Se necesitan al menos 3 registros por empleado
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          Rendimiento por Propinas
        </h3>
        <Badge variant="outline" className="text-xs">
          Últimos 30 días
        </Badge>
      </div>

      <div className="space-y-3">
        {ratings.map((waiter, index) => (
          <div 
            key={waiter.waiterId}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{waiter.waiterName}</p>
                <p className="text-xs text-muted-foreground">
                  {waiter.salesCount} ventas · {formatCurrency(waiter.totalTips)} total
                </p>
              </div>
            </div>
            <div className="text-right">
              {renderStars(waiter.rating)}
              <p className="text-xs text-muted-foreground mt-1">
                Prom: {formatCurrency(waiter.avgTipPerSale)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WaiterTipRating;
