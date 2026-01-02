import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasData } from '@/hooks/useGasData';
import { 
  Truck, 
  MapPin, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Flag,
  Phone,
  User,
  ChevronRight,
  Banknote,
  CreditCard,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReportIncidentModal from './modals/ReportIncidentModal';

const GasAppConductor: React.FC = () => {
  const { 
    myRoute,
    useRouteDeliveries,
    startRoute,
    completeDelivery,
    finishRoute,
    isStartingRoute,
    isCompletingDelivery,
    isFinishingRoute,
    isLoading 
  } = useGasData();

  const { data: deliveries = [], isLoading: deliveriesLoading } = useRouteDeliveries(myRoute?.id || null);

  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentDelivery, setIncidentDelivery] = useState<any>(null);
  const [receiverName, setReceiverName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'credit' | 'no_pay'>('cash');

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered' || d.status === 'partial');

  const handleStartRoute = () => {
    if (myRoute?.id) {
      startRoute(myRoute.id);
    }
  };

  const handleOpenDelivery = (delivery: any) => {
    setSelectedDelivery(delivery);
    setReceiverName('');
    setPaymentMethod('cash');
    setShowDeliveryModal(true);
  };

  const handleCompleteDelivery = () => {
    if (selectedDelivery && receiverName) {
      completeDelivery({
        deliveryId: selectedDelivery.id,
        deliveredQty: selectedDelivery.planned_qty,
        receiverName,
        paymentMethod,
      });
      setShowDeliveryModal(false);
      setSelectedDelivery(null);
    }
  };

  const handleFinishRoute = () => {
    if (myRoute?.id) {
      finishRoute(myRoute.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // No route assigned
  if (!myRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <Truck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Sin ruta asignada</h2>
        <p className="text-muted-foreground text-center max-w-xs">
          No tienes una ruta asignada para hoy. Contacta a logística si crees que es un error.
        </p>
      </div>
    );
  }

  const routeNotStarted = myRoute.status === 'planned';
  const routeInProgress = myRoute.status === 'in_progress';

  return (
    <div className="space-y-4 pb-24">
      {/* Route Header Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{myRoute.route_number}</h2>
              <p className="text-sm text-muted-foreground">
                {myRoute.vehicle?.plate || 'Vehículo no asignado'}
              </p>
            </div>
            <Badge 
              className={`${
                routeInProgress ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {routeInProgress ? 'En ruta' : 'Planificada'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-lg font-bold text-foreground">{deliveries.length}</p>
              <p className="text-xs text-muted-foreground">Entregas</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-lg font-bold text-green-400">{completedDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <p className="text-lg font-bold text-orange-400">{pendingDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>

          {/* Start Route Button */}
          {routeNotStarted && (
            <Button 
              className="w-full mt-4 bg-green-500 hover:bg-green-600 h-12 text-base"
              onClick={handleStartRoute}
              disabled={isStartingRoute}
            >
              <Play className="h-5 w-5 mr-2" />
              {isStartingRoute ? 'Iniciando...' : 'Iniciar Ruta'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-400" />
            Entregas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deliveriesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : deliveries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No hay entregas programadas
            </p>
          ) : (
            deliveries.map((delivery, index) => (
              <div 
                key={delivery.id}
                className={`p-4 rounded-lg border ${
                  delivery.status === 'delivered' 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-background/50 border-border/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      delivery.status === 'delivered' ? 'bg-green-500/20' :
                      delivery.status === 'not_delivered' ? 'bg-red-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {delivery.status === 'delivered' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : delivery.status === 'not_delivered' ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <span className="text-sm font-bold text-orange-400">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{delivery.client?.name || 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {delivery.client?.address || 'Sin dirección'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {delivery.planned_qty} {delivery.unit}
                        </Badge>
                        {delivery.client?.contact_phone && (
                          <a 
                            href={`tel:${delivery.client.contact_phone}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {delivery.status === 'pending' && routeInProgress && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                          onClick={() => {
                            setIncidentDelivery(delivery);
                            setShowIncidentModal(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleOpenDelivery(delivery)}
                        >
                          Entregar
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </>
                    )}

                    {delivery.status === 'delivered' && (
                      <div className="text-right">
                        <p className="text-xs text-green-400">Entregado</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.receiver_name}
                        </p>
                      </div>
                    )}

                    {delivery.status === 'not_delivered' && (
                      <div className="text-right">
                        <p className="text-xs text-red-400">No entregado</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {delivery.incident_reason || 'Incidente'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Finish Route Button - Fixed at bottom */}
      {routeInProgress && pendingDeliveries.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border">
          <Button 
            className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
            onClick={handleFinishRoute}
            disabled={isFinishingRoute}
          >
            <Flag className="h-5 w-5 mr-2" />
            {isFinishingRoute ? 'Finalizando...' : 'Finalizar Ruta'}
          </Button>
        </div>
      )}

      {/* Delivery Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.client?.name} - {selectedDelivery?.planned_qty} {selectedDelivery?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Receiver Name */}
            <div className="space-y-2">
              <Label htmlFor="receiver">Nombre de quien recibe</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="receiver"
                  placeholder="Nombre completo"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Payment Method - NO AMOUNT INPUT */}
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className={paymentMethod === 'cash' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                  className={paymentMethod === 'transfer' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  onClick={() => setPaymentMethod('transfer')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transferencia
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                  className={paymentMethod === 'credit' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                  onClick={() => setPaymentMethod('credit')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Crédito
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'no_pay' ? 'default' : 'outline'}
                  className={paymentMethod === 'no_pay' ? 'bg-red-500 hover:bg-red-600' : ''}
                  onClick={() => setPaymentMethod('no_pay')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  No pagó
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={handleCompleteDelivery}
              disabled={!receiverName || isCompletingDelivery}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isCompletingDelivery ? 'Guardando...' : 'Confirmar Entrega'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incident Modal */}
      <ReportIncidentModal
        open={showIncidentModal}
        onOpenChange={setShowIncidentModal}
        delivery={incidentDelivery}
        routeId={myRoute?.id || ''}
      />
    </div>
  );
};

export default GasAppConductor;
