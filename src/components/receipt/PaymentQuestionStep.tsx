import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banknote, CreditCard, Clock, ArrowRight, Calendar } from 'lucide-react';

export interface PaymentQuestionResult {
  paidToday: boolean;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | null;
  dueDate?: string;
}

interface PaymentQuestionStepProps {
  supplierName: string;
  totalAmount: number;
  onComplete: (result: PaymentQuestionResult) => void;
  onBack: () => void;
}

const PaymentQuestionStep: React.FC<PaymentQuestionStepProps> = ({
  supplierName,
  totalAmount,
  onComplete,
  onBack
}) => {
  const [paidToday, setPaidToday] = useState<'yes' | 'no' | 'credit' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | null>(null);
  const [dueDate, setDueDate] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleContinue = () => {
    if (paidToday === 'credit') {
      onComplete({
        paidToday: false,
        paymentMethod: 'credito',
        dueDate: dueDate || undefined
      });
    } else if (paidToday === 'yes' && paymentMethod) {
      onComplete({
        paidToday: true,
        paymentMethod
      });
    } else if (paidToday === 'no') {
      onComplete({
        paidToday: false,
        paymentMethod: null
      });
    }
  };

  const canContinue = 
    (paidToday === 'yes' && paymentMethod) ||
    paidToday === 'no' ||
    (paidToday === 'credit');

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            💰 ¿Cómo se pagó esta factura?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Factura de <span className="font-semibold">{supplierName}</span> por{' '}
            <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pregunta 1: ¿Se pagó hoy? */}
          <div className="space-y-3">
            <Label className="text-base font-medium">¿Esta factura ya fue pagada?</Label>
            <RadioGroup
              value={paidToday || ''}
              onValueChange={(value) => {
                setPaidToday(value as 'yes' | 'no' | 'credit');
                if (value !== 'yes') setPaymentMethod(null);
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="yes" id="paid-yes" />
                <Label htmlFor="paid-yes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span>Sí, ya se pagó hoy</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="credit" id="paid-credit" />
                <Label htmlFor="paid-credit" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span>A crédito (pago posterior)</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="no" id="paid-no" />
                <Label htmlFor="paid-no" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Ya se pagó antes (no afecta caja de hoy)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Pregunta 2: ¿Cómo se pagó? (solo si paidToday === 'yes') */}
          {paidToday === 'yes' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label className="text-base font-medium">¿Cómo se pagó?</Label>
              <RadioGroup
                value={paymentMethod || ''}
                onValueChange={(value) => setPaymentMethod(value as 'efectivo' | 'tarjeta' | 'transferencia')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-green-50 cursor-pointer">
                  <RadioGroupItem value="efectivo" id="method-cash" />
                  <Label htmlFor="method-cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium">Efectivo</span>
                      <p className="text-xs text-muted-foreground">Se descontará de la caja física</p>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-blue-50 cursor-pointer">
                  <RadioGroupItem value="tarjeta" id="method-card" />
                  <Label htmlFor="method-card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="font-medium">Tarjeta</span>
                      <p className="text-xs text-muted-foreground">No afecta caja física</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-purple-50 cursor-pointer">
                  <RadioGroupItem value="transferencia" id="method-transfer" />
                  <Label htmlFor="method-transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <div>
                      <span className="font-medium">Transferencia</span>
                      <p className="text-xs text-muted-foreground">No afecta caja física</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Fecha de vencimiento para crédito */}
          {paidToday === 'credit' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label className="text-base font-medium">Fecha de vencimiento (opcional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Esta factura quedará en cuentas por pagar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!canContinue}
          className="bg-green-600 hover:bg-green-700"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentQuestionStep;
