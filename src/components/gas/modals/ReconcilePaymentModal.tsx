import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  Clock,
  AlertTriangle,
  Loader2,
  User,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReconcilePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReconcilePaymentModal: React.FC<ReconcilePaymentModalProps> = ({ open, onOpenChange }) => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = restaurant?.id;

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notes, setNotes] = useState('');

  // Query pending payments
  const { data: pendingPayments = [], isLoading } = useQuery({
    queryKey: ['gas_pending_payments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('gas_payments_events')
        .select(`
          *,
          delivery:gas_deliveries(
            *,
            client:gas_clients(name, address),
            route:gas_routes(route_number)
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && open,
  });

  // Reconcile payment mutation
  const reconcileMutation = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: 'confirmed' | 'pending_review' }) => {
      // For now, we'll just add a note - in production you'd update a status field
      const { error } = await supabase
        .from('gas_payments_events')
        .update({ 
          notes: notes || 'Conciliado por cartera',
        })
        .eq('id', paymentId);
      
      if (error) throw error;

      // If it's credit, create AR ledger entry
      if (selectedPayment?.method === 'credit') {
        const { error: arError } = await supabase
          .from('gas_ar_ledger')
          .insert({
            tenant_id: tenantId!,
            client_id: selectedPayment.delivery?.client_id,
            delivery_id: selectedPayment.delivery_id,
            entry_type: 'invoice',
            amount: selectedPayment.delivery?.total_amount || 0,
            status: 'open',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_by: user?.id,
          });
        if (arError) throw arError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_pending_payments'] });
      queryClient.invalidateQueries({ queryKey: ['gas_ar_ledger'] });
      toast({ title: '¡Pago conciliado!' });
      setSelectedPayment(null);
      setNotes('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4 text-green-400" />;
      case 'transfer': return <CreditCard className="h-4 w-4 text-blue-400" />;
      case 'credit': return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'credit': return 'Crédito';
      case 'no_pay': return 'Sin pago';
      default: return method;
    }
  };

  const cashPayments = pendingPayments.filter(p => p.method === 'cash');
  const transferPayments = pendingPayments.filter(p => p.method === 'transfer');
  const creditPayments = pendingPayments.filter(p => p.method === 'credit');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Conciliación de Pagos
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Efectivo</span>
            </div>
            <p className="text-xl font-bold">{cashPayments.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Transferencia</span>
            </div>
            <p className="text-xl font-bold">{transferPayments.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Crédito</span>
            </div>
            <p className="text-xl font-bold">{creditPayments.length}</p>
          </div>
        </div>

        {/* Payments List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay pagos pendientes de conciliar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPayment?.id === payment.id 
                      ? 'border-green-500 bg-green-500/5' 
                      : 'border-border/30 bg-background/50 hover:border-border/50'
                  }`}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment.method === 'cash' ? 'bg-green-500/20' :
                        payment.method === 'transfer' ? 'bg-blue-500/20' :
                        payment.method === 'credit' ? 'bg-yellow-500/20' :
                        'bg-red-500/20'
                      }`}>
                        {getMethodIcon(payment.method)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {payment.delivery?.client?.name || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ruta {payment.delivery?.route?.route_number} • {payment.delivery?.client?.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline"
                        className={`${
                          payment.method === 'cash' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          payment.method === 'transfer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        }`}
                      >
                        {getMethodLabel(payment.method)}
                      </Badge>
                      <p className="text-lg font-bold mt-1">
                        ${(payment.delivery?.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {payment.collected_by_driver && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Recaudado por conductor</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Reconcile Form */}
        {selectedPayment && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedPayment.delivery?.client?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getMethodLabel(selectedPayment.method)} - ${(selectedPayment.delivery?.total_amount || 0).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(selectedPayment.created_at), 'HH:mm', { locale: es })}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Observaciones sobre el pago..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {selectedPayment && (
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => reconcileMutation.mutate({ 
                paymentId: selectedPayment.id, 
                status: 'confirmed' 
              })}
              disabled={reconcileMutation.isPending}
            >
              {reconcileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Conciliación
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReconcilePaymentModal;
