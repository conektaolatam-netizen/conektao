import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GasRoute, useGasData } from '@/hooks/useGasData';
import { Package, Truck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface ReviewReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: GasRoute | null;
}

const ReviewReturnModal: React.FC<ReviewReturnModalProps> = ({ open, onOpenChange, route }) => {
  const { reviewRouteReturn, isReviewingReturn } = useGasData();
  
  const [actualReturn, setActualReturn] = useState('');
  const [mermaReason, setMermaReason] = useState('');

  if (!route) return null;

  const expectedReturn = route.expected_return_qty || 0;
  const actualNum = parseFloat(actualReturn) || 0;
  const difference = expectedReturn - actualNum;
  const hasMerma = difference > 0.5; // 0.5 kg tolerance

  const handleSubmit = () => {
    if (actualNum < 0) return;

    reviewRouteReturn({
      routeId: route.id,
      actualReturnQty: actualNum,
      mermaReason: hasMerma ? mermaReason : undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setActualReturn('');
        setMermaReason('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-yellow-400" />
            Revisar Inventario Devuelto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Route Info */}
          <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ruta</span>
              <Badge variant="outline">{route.route_number}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vehículo</span>
              <span className="text-sm font-medium">{route.vehicle?.plate || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gas Asignado</span>
              <span className="text-sm font-medium">{route.assigned_qty || 0} {route.assigned_unit}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 mt-2">
              <span className="text-sm font-medium">Retorno Esperado</span>
              <Badge className="bg-blue-500/20 text-blue-400">
                {expectedReturn.toFixed(1)} kg
              </Badge>
            </div>
          </div>

          {/* Actual Return Input */}
          <div className="space-y-2">
            <Label>Cantidad Real Devuelta (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ingrese cantidad real"
              value={actualReturn}
              onChange={(e) => setActualReturn(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Difference Alert */}
          {actualReturn && (
            hasMerma ? (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Diferencia detectada: <strong>{difference.toFixed(1)} kg</strong> menos de lo esperado.
                  Esto se registrará como merma.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  Inventario coincide con lo esperado. Sin merma detectada.
                </AlertDescription>
              </Alert>
            )
          )}

          {/* Merma Reason */}
          {hasMerma && (
            <div className="space-y-2">
              <Label>Razón de la Diferencia</Label>
              <Textarea
                placeholder="Explique la razón de la merma..."
                value={mermaReason}
                onChange={(e) => setMermaReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={actualNum < 0 || (hasMerma && !mermaReason.trim()) || isReviewingReturn}
            className={hasMerma ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {isReviewingReturn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Cerrar Ruta'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewReturnModal;
