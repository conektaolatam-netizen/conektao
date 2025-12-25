import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Camera, Edit3, X } from 'lucide-react';
import type { ValidationResult, ConfidenceBreakdown } from '@/lib/receiptValidation';

interface ReceiptBlockedStateProps {
  validation: ValidationResult;
  confidenceBreakdown?: ConfidenceBreakdown;
  onRescan: () => void;
  onManualEntry: () => void;
  onCancel: () => void;
}

export const ReceiptBlockedState: React.FC<ReceiptBlockedStateProps> = ({
  validation,
  confidenceBreakdown,
  onRescan,
  onManualEntry,
  onCancel
}) => {
  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          No pudimos leer esta factura correctamente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensaje claro de lo que pasó */}
        <div className="text-sm text-muted-foreground">
          Detectamos una imagen, pero no se identificaron correctamente los datos críticos.
          <strong className="block mt-1 text-foreground">
            Esta factura NO será guardada ni afectará caja o inventario.
          </strong>
        </div>

        {/* Desglose de problemas */}
        <div className="bg-background rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium mb-3">Problemas detectados:</p>
          {validation.issues.map((issue, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <X className="h-4 w-4 text-destructive flex-shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
        </div>

        {/* Desglose de confianza real */}
        {confidenceBreakdown && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium mb-3">Análisis de confianza (real):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Proveedor:</span>
                <span className={confidenceBreakdown.supplier > 50 ? 'text-green-600' : 'text-destructive'}>
                  {confidenceBreakdown.supplier}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className={confidenceBreakdown.total > 50 ? 'text-green-600' : 'text-destructive'}>
                  {confidenceBreakdown.total}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Items:</span>
                <span className={confidenceBreakdown.items > 50 ? 'text-green-600' : 'text-destructive'}>
                  {confidenceBreakdown.items}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coincidencia total:</span>
                <span className={confidenceBreakdown.totalMatch > 50 ? 'text-green-600' : 'text-amber-600'}>
                  {confidenceBreakdown.totalMatch}%
                </span>
              </div>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Confianza final:</span>
              <span className="text-destructive">{confidenceBreakdown.weighted}%</span>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={onRescan} className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            🔄 Reescanear factura
          </Button>
          <Button onClick={onManualEntry} variant="secondary" className="flex-1">
            <Edit3 className="h-4 w-4 mr-2" />
            ✍️ Usar modo manual
          </Button>
          <Button onClick={onCancel} variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Advertencia */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tip: Para mejores resultados, fotografía la factura con buena iluminación y encuadre completo
        </p>
      </CardContent>
    </Card>
  );
};
