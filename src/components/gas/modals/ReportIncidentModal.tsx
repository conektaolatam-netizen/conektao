import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  AlertTriangle, 
  User, 
  XCircle, 
  Truck,
  Flame,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  routeId: string;
}

const INCIDENT_TYPES = [
  { value: 'client_absent', label: 'Cliente ausente', icon: User, color: 'yellow' },
  { value: 'client_refused', label: 'Cliente rechazó', icon: XCircle, color: 'red' },
  { value: 'vehicle_issue', label: 'Problema con vehículo', icon: Truck, color: 'orange' },
  { value: 'gas_leak', label: 'Fuga detectada', icon: Flame, color: 'red' },
  { value: 'other', label: 'Otro', icon: HelpCircle, color: 'gray' },
];

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ 
  open, 
  onOpenChange, 
  delivery,
  routeId,
}) => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = restaurant?.id;

  const [incidentType, setIncidentType] = useState('client_absent');
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !delivery?.id) throw new Error('Datos incompletos');

      // Update delivery status
      const { error: deliveryError } = await supabase
        .from('gas_deliveries')
        .update({
          status: 'not_delivered',
          incident_reason: description || INCIDENT_TYPES.find(t => t.value === incidentType)?.label,
        })
        .eq('id', delivery.id);
      if (deliveryError) throw deliveryError;

      // Create anomaly record
      const { error: anomalyError } = await supabase
        .from('gas_anomalies')
        .insert({
          tenant_id: tenantId,
          anomaly_type: incidentType,
          route_id: routeId,
          delivery_id: delivery.id,
          severity: incidentType === 'gas_leak' ? 'critical' : 'medium',
          status: 'new',
          title: `Incidente: ${INCIDENT_TYPES.find(t => t.value === incidentType)?.label}`,
          description: description || null,
          assigned_to: null,
        });
      if (anomalyError) throw anomalyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gas_deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['gas_anomalies'] });
      toast({ 
        title: 'Incidente reportado',
        description: 'El equipo de logística ha sido notificado.'
      });
      onOpenChange(false);
      setIncidentType('client_absent');
      setDescription('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Reportar Incidente
          </DialogTitle>
          <DialogDescription>
            {delivery?.client?.name} - {delivery?.planned_qty} {delivery?.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Incident Type */}
          <div className="space-y-3">
            <Label>¿Qué ocurrió?</Label>
            <RadioGroup value={incidentType} onValueChange={setIncidentType}>
              {INCIDENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div 
                    key={type.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      incidentType === type.value 
                        ? 'border-yellow-500/50 bg-yellow-500/5' 
                        : 'border-border/30 hover:border-border/50'
                    }`}
                    onClick={() => setIncidentType(type.value)}
                  >
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Icon className={`h-5 w-5 ${
                      type.color === 'yellow' ? 'text-yellow-400' :
                      type.color === 'red' ? 'text-red-400' :
                      type.color === 'orange' ? 'text-orange-400' :
                      'text-muted-foreground'
                    }`} />
                    <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              placeholder="Detalles adicionales del incidente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning for critical incidents */}
          {incidentType === 'gas_leak' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <Flame className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400 text-sm">¡Alerta crítica!</p>
                <p className="text-xs text-muted-foreground">
                  Este incidente será escalado inmediatamente a gerencia.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar Incidente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIncidentModal;
