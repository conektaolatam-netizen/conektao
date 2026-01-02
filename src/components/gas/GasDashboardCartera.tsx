import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasData } from '@/hooks/useGasData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  DollarSign, 
  Users, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Banknote,
  Plus,
  FileCheck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CreateClientModal from './modals/CreateClientModal';
import ReconcilePaymentModal from './modals/ReconcilePaymentModal';

const GasDashboardCartera: React.FC = () => {
  const { restaurant } = useAuth();
  const tenantId = restaurant?.id;
  const { 
    clients,
    isLoading 
  } = useGasData();

  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);

  // Query today's payments summary
  const { data: paymentsSummary } = useQuery({
    queryKey: ['gas_payments_summary', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const today = new Date().toISOString().split('T')[0];
      
      const { data: payments, error } = await supabase
        .from('gas_payments_events')
        .select(`
          method,
          delivery:gas_deliveries(total_amount)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', `${today}T00:00:00`);

      if (error) throw error;

      const cash = payments?.filter(p => p.method === 'cash') || [];
      const transfer = payments?.filter(p => p.method === 'transfer') || [];
      const credit = payments?.filter(p => p.method === 'credit') || [];
      const noPay = payments?.filter(p => p.method === 'no_pay') || [];

      const cashTotal = cash.reduce((sum, p) => sum + (p.delivery?.total_amount || 0), 0);
      const transferTotal = transfer.reduce((sum, p) => sum + (p.delivery?.total_amount || 0), 0);
      const creditTotal = credit.reduce((sum, p) => sum + (p.delivery?.total_amount || 0), 0);

      return {
        cashCount: cash.length,
        cashTotal,
        transferCount: transfer.length,
        transferTotal,
        creditCount: credit.length,
        creditTotal,
        pendingCount: noPay.length,
        totalPayments: payments?.length || 0,
      };
    },
    enabled: !!tenantId,
  });

  // Query AR ledger (pending credits)
  const { data: arSummary } = useQuery({
    queryKey: ['gas_ar_summary', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('gas_ar_ledger')
        .select('amount, status, due_date')
        .eq('tenant_id', tenantId)
        .eq('status', 'open');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const overdue = data?.filter(a => a.due_date && a.due_date < today) || [];
      const totalOpen = data?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;
      const totalOverdue = overdue.reduce((sum, a) => sum + (a.amount || 0), 0);

      return {
        openCount: data?.length || 0,
        totalOpen,
        overdueCount: overdue.length,
        totalOverdue,
      };
    },
    enabled: !!tenantId,
  });

  const activeClients = clients.filter(c => c.status === 'active').length;
  const restrictedClients = clients.filter(c => c.status === 'restricted').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-card/50">
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
          <h1 className="text-2xl font-bold text-foreground">Panel de Cartera</h1>
          <p className="text-muted-foreground">Gestión de pagos y conciliación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateClient(true)}>
            <Users className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
          <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowReconcile(true)}>
            <FileCheck className="h-4 w-4 mr-2" />
            Conciliar Pagos
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Banknote className="h-4 w-4" />
              <span className="text-sm font-medium">Efectivo Hoy</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${(paymentsSummary?.cashTotal || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{paymentsSummary?.cashCount || 0} pagos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Transferencias</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${(paymentsSummary?.transferTotal || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{paymentsSummary?.transferCount || 0} pagos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Crédito</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${(paymentsSummary?.creditTotal || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{paymentsSummary?.creditCount || 0} facturas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Vencidos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${(arSummary?.totalOverdue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{arSummary?.overdueCount || 0} cuentas</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Clientes ({clients.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                {activeClients} activos
              </Badge>
              {restrictedClients > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  {restrictedClients} restringidos
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowCreateClient(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No hay clientes registrados</p>
              <Button variant="outline" onClick={() => setShowCreateClient(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 10).map(client => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/20 hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      client.status === 'active' ? 'bg-green-500/20' :
                      client.status === 'restricted' ? 'bg-yellow-500/20' :
                      'bg-red-500/20'
                    }`}>
                      <Users className={`h-5 w-5 ${
                        client.status === 'active' ? 'text-green-400' :
                        client.status === 'restricted' ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.contact_name || 'Sin contacto'} • {client.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline"
                      className={`${
                        client.client_type === 'contract' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                          : 'bg-muted'
                      }`}
                    >
                      {client.client_type === 'contract' ? 'Contrato' : 'Libre'}
                    </Badge>
                    <Badge 
                      className={`${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        client.status === 'restricted' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {client.status === 'active' ? 'Activo' :
                       client.status === 'restricted' ? 'Restringido' : 'Bloqueado'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateClientModal open={showCreateClient} onOpenChange={setShowCreateClient} />
      <ReconcilePaymentModal open={showReconcile} onOpenChange={setShowReconcile} />
    </div>
  );
};

export default GasDashboardCartera;
