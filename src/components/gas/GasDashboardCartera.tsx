import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasData } from '@/hooks/useGasData';
import { 
  DollarSign, 
  Users, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Banknote,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CreateClientModal from './modals/CreateClientModal';

const GasDashboardCartera: React.FC = () => {
  const { 
    clients,
    isLoading 
  } = useGasData();

  const [showCreateClient, setShowCreateClient] = useState(false);

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
          <Button className="bg-green-500 hover:bg-green-600">
            <DollarSign className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Clientes Activos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeClients}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Restringidos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{restrictedClients}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Por Conciliar</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Vencidos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Clientes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateClient(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
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

      {/* Payment Methods Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-400" />
              Pagos en Efectivo Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-400">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Pendiente conciliación</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Transferencias Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-blue-400">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Verificadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateClientModal open={showCreateClient} onOpenChange={setShowCreateClient} />
    </div>
  );
};

export default GasDashboardCartera;
