import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Coins, 
  Users, 
  Clock, 
  Check, 
  Wallet,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { getLocalDayRange } from '@/lib/date';

interface TipPayout {
  id: string;
  distribution_id: string;
  employee_id: string;
  amount: number;
  percentage: number;
  hours_worked: number;
  status: 'pending' | 'paid' | 'withdrawn';
  created_at: string;
  employee_name?: string;
}

interface TipDistribution {
  id: string;
  total_tip_amount: number;
  distribution_type: string;
  distributed_at: string;
  distributed_by_name?: string;
  payouts: TipPayout[];
}

interface TipPayoutsSectionProps {
  cashRegisterId?: string;
  onPayoutCompleted?: () => void;
}

const TipPayoutsSection = ({ cashRegisterId, onPayoutCompleted }: TipPayoutsSectionProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [distributions, setDistributions] = useState<TipDistribution[]>([]);
  const [expandedDistribution, setExpandedDistribution] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState({
    totalCollected: 0,
    totalDistributed: 0,
    totalPaid: 0,
    totalPending: 0
  });

  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  useEffect(() => {
    if (restaurant?.id) {
      loadTipData();
    }
  }, [restaurant?.id]);

  const loadTipData = async () => {
    if (!restaurant?.id) return;
    setLoading(true);

    try {
      const { startISO, endISO } = getLocalDayRange();

      // Load today's tip distributions
      const { data: distData, error: distError } = await supabase
        .from('tip_distributions')
        .select(`
          *,
          distributed_by_profile:profiles!tip_distributions_distributed_by_fkey(full_name)
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('distributed_at', startISO)
        .lt('distributed_at', endISO)
        .order('distributed_at', { ascending: false });

      if (distError) throw distError;

      // Load payouts for each distribution
      const distributionsWithPayouts: TipDistribution[] = [];
      let totalCollected = 0;
      let totalPaid = 0;
      let totalPending = 0;

      for (const dist of distData || []) {
        const { data: payouts, error: payoutsError } = await supabase
          .from('tip_payouts')
          .select(`
            *,
            employee:profiles!tip_payouts_employee_id_fkey(full_name)
          `)
          .eq('distribution_id', dist.id);

        if (payoutsError) throw payoutsError;

        const formattedPayouts = (payouts || []).map((p: any) => ({
          ...p,
          employee_name: p.employee?.full_name || 'Empleado'
        }));

        totalCollected += dist.total_tip_amount;
        formattedPayouts.forEach((p: TipPayout) => {
          if (p.status === 'paid' || p.status === 'withdrawn') {
            totalPaid += p.amount;
          } else {
            totalPending += p.amount;
          }
        });

        distributionsWithPayouts.push({
          ...dist,
          distributed_by_name: dist.distributed_by_profile?.full_name || 'Usuario',
          payouts: formattedPayouts
        });
      }

      setDistributions(distributionsWithPayouts);
      setTodayStats({
        totalCollected,
        totalDistributed: totalCollected,
        totalPaid,
        totalPending
      });
    } catch (error) {
      console.error('Error loading tip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (payoutId: string, employeeName: string, amount: number) => {
    if (!profile?.id || !cashRegisterId) return;

    try {
      // Update payout status
      const { error: updateError } = await supabase
        .from('tip_payouts')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: profile.id
        })
        .eq('id', payoutId);

      if (updateError) throw updateError;

      // Register cash payment (negative for cash out)
      const { error: paymentError } = await supabase
        .from('cash_payments')
        .insert({
          cash_register_id: cashRegisterId,
          user_id: profile.id,
          amount: -amount,
          description: `💰 Propina - ${employeeName}`,
          category: 'tip_payout',
          payment_method: 'efectivo'
        });

      if (paymentError) throw paymentError;

      toast({
        title: '✅ Propina pagada',
        description: `${formatCurrency(amount)} entregado a ${employeeName}`
      });

      loadTipData();
      onPayoutCompleted?.();
    } catch (error) {
      console.error('Error marking payout as paid:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago',
        variant: 'destructive'
      });
    }
  };

  const handlePayAllPending = async () => {
    if (!profile?.id || !cashRegisterId) {
      toast({
        title: 'Error',
        description: 'No hay caja abierta para registrar los pagos',
        variant: 'destructive'
      });
      return;
    }

    const pendingPayouts: {id: string, employeeName: string, amount: number}[] = [];
    distributions.forEach(dist => {
      dist.payouts.forEach(p => {
        if (p.status === 'pending') {
          pendingPayouts.push({
            id: p.id,
            employeeName: p.employee_name || 'Empleado',
            amount: p.amount
          });
        }
      });
    });

    if (pendingPayouts.length === 0) {
      toast({
        title: 'Sin propinas pendientes',
        description: 'Todas las propinas han sido pagadas'
      });
      return;
    }

    for (const payout of pendingPayouts) {
      await handleMarkAsPaid(payout.id, payout.employeeName, payout.amount);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardContent className="p-6 text-center">
          <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-400 animate-pulse" />
          <p className="text-muted-foreground">Cargando propinas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span>Propinas del Día</span>
          </div>
          {todayStats.totalPending > 0 && isOwnerOrAdmin && (
            <Button
              size="sm"
              onClick={handlePayAllPending}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black"
            >
              <Wallet className="h-4 w-4 mr-1" />
              Pagar Todo
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-green-400">Recaudado</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(todayStats.totalCollected)}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400">Pagado</p>
            <p className="text-lg font-bold text-blue-400">{formatCurrency(todayStats.totalPaid)}</p>
          </div>
        </div>

        {todayStats.totalPending > 0 && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-400">Pendiente por pagar</p>
              <p className="text-lg font-bold text-orange-400">{formatCurrency(todayStats.totalPending)}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-orange-400" />
          </div>
        )}

        <Separator />

        {/* Distributions list */}
        {distributions.length === 0 ? (
          <div className="text-center py-6">
            <Coins className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay propinas distribuidas hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distributions.map(dist => (
              <div key={dist.id} className="rounded-lg border border-border/50 overflow-hidden">
                <button
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedDistribution(
                    expandedDistribution === dist.id ? null : dist.id
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatCurrency(dist.total_tip_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(dist.distributed_at)} • {dist.payouts.length} meseros
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {dist.distribution_type === 'equal' ? 'Equitativa' : 
                       dist.distribution_type === 'by_hours' ? 'Por Horas' : 'Manual'}
                    </Badge>
                    {expandedDistribution === dist.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedDistribution === dist.id && (
                  <div className="border-t border-border/50 bg-muted/30 p-3 space-y-2">
                    {dist.payouts.map(payout => (
                      <div 
                        key={payout.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{payout.employee_name}</span>
                          {payout.hours_worked > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {payout.hours_worked.toFixed(1)}h
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(payout.amount)}</span>
                          {payout.status === 'pending' ? (
                            isOwnerOrAdmin ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(payout.id, payout.employee_name || '', payout.amount)}
                                className="h-7 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Pagar
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                                Pendiente
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-green-400 border-green-400/50">
                              <Check className="h-3 w-3 mr-1" />
                              Pagado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground text-right">
                      Distribuido por: {dist.distributed_by_name}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TipPayoutsSection;
