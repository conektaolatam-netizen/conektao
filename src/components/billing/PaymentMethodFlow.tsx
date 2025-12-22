import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Clock, 
  Wallet,
  CalendarIcon,
  CheckCircle,
  ArrowLeft,
  Building2,
  Landmark,
  SplitSquareHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethodType = 
  | 'cash_register' 
  | 'cash_petty' 
  | 'transfer' 
  | 'card' 
  | 'credit' 
  | 'loan' 
  | 'split';

export interface PaymentInfo {
  method: PaymentMethodType;
  amount: number;
  paidFromRegister?: boolean;
  transferReference?: string;
  transferBank?: string;
  creditDays?: number;
  creditDueDate?: Date;
  loanSource?: string;
  loanReference?: string;
  splitDetails?: {
    cashAmount: number;
    otherAmount: number;
    otherMethod: 'transfer' | 'card';
  };
}

interface PaymentMethodFlowProps {
  totalAmount: number;
  supplierName: string;
  onComplete: (paymentInfo: PaymentInfo) => void;
  onCancel: () => void;
}

const PaymentMethodFlow: React.FC<PaymentMethodFlowProps> = ({
  totalAmount,
  supplierName,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'method' | 'details'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<Partial<PaymentInfo>>({
    amount: totalAmount
  });
  const [creditDueDate, setCreditDueDate] = useState<Date | undefined>(addDays(new Date(), 30));

  const paymentMethods = [
    {
      id: 'cash_register' as PaymentMethodType,
      label: 'Efectivo (Caja del día)',
      icon: Banknote,
      description: 'Pago en efectivo de la caja registradora',
      color: 'bg-green-500'
    },
    {
      id: 'cash_petty' as PaymentMethodType,
      label: 'Efectivo (Base/Caja menor)',
      icon: Wallet,
      description: 'Pago desde la caja menor o base',
      color: 'bg-emerald-500'
    },
    {
      id: 'transfer' as PaymentMethodType,
      label: 'Transferencia',
      icon: Smartphone,
      description: 'Nequi, Daviplata, Bancolombia, etc.',
      color: 'bg-blue-500'
    },
    {
      id: 'card' as PaymentMethodType,
      label: 'Tarjeta',
      icon: CreditCard,
      description: 'Débito o crédito empresarial',
      color: 'bg-purple-500'
    },
    {
      id: 'credit' as PaymentMethodType,
      label: 'Crédito con proveedor',
      icon: Clock,
      description: 'Pagar después (7, 15, 30, 60 días)',
      color: 'bg-orange-500'
    },
    {
      id: 'split' as PaymentMethodType,
      label: 'Pago dividido',
      icon: SplitSquareHorizontal,
      description: 'Parte efectivo + parte transferencia/tarjeta',
      color: 'bg-pink-500'
    }
  ];

  const creditOptions = [
    { days: 7, label: '7 días' },
    { days: 15, label: '15 días' },
    { days: 30, label: '30 días' },
    { days: 60, label: '60 días' },
    { days: 90, label: '90 días' }
  ];

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setPaymentInfo({ ...paymentInfo, method });
    
    // For simple methods, complete immediately
    if (method === 'cash_register' || method === 'cash_petty' || method === 'card') {
      onComplete({
        method,
        amount: totalAmount,
        paidFromRegister: method === 'cash_register'
      });
    } else {
      setStep('details');
    }
  };

  const handleCreditDaysSelect = (days: number) => {
    const dueDate = addDays(new Date(), days);
    setCreditDueDate(dueDate);
    setPaymentInfo({
      ...paymentInfo,
      creditDays: days,
      creditDueDate: dueDate
    });
  };

  const handleTransferComplete = () => {
    onComplete({
      method: 'transfer',
      amount: totalAmount,
      transferReference: paymentInfo.transferReference,
      transferBank: paymentInfo.transferBank
    });
  };

  const handleCreditComplete = () => {
    if (!creditDueDate) return;
    
    onComplete({
      method: 'credit',
      amount: totalAmount,
      creditDays: paymentInfo.creditDays,
      creditDueDate: creditDueDate
    });
  };

  const handleSplitComplete = () => {
    if (!paymentInfo.splitDetails) return;
    
    onComplete({
      method: 'split',
      amount: totalAmount,
      splitDetails: paymentInfo.splitDetails
    });
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-semibold">¿Cómo pagaste esta factura?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {supplierName} • ${totalAmount.toLocaleString('es-CO')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method.id)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md text-left",
              "border-border hover:border-primary hover:bg-accent/50"
            )}
          >
            <div className={cn("p-2 rounded-full text-white", method.color)}>
              <method.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{method.label}</p>
              <p className="text-xs text-muted-foreground">{method.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  );

  const renderTransferDetails = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep('method')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Cambiar método
      </Button>
      
      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
        <Smartphone className="h-6 w-6 text-blue-600" />
        <div>
          <p className="font-semibold">Pago por transferencia</p>
          <p className="text-sm text-muted-foreground">${totalAmount.toLocaleString('es-CO')}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label>Banco o aplicación (opcional)</Label>
          <Input
            placeholder="Ej: Nequi, Daviplata, Bancolombia"
            value={paymentInfo.transferBank || ''}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, transferBank: e.target.value })}
          />
        </div>
        
        <div>
          <Label>Referencia de transacción (opcional)</Label>
          <Input
            placeholder="Número de referencia o comprobante"
            value={paymentInfo.transferReference || ''}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, transferReference: e.target.value })}
          />
        </div>
      </div>
      
      <Button onClick={handleTransferComplete} className="w-full">
        <CheckCircle className="h-4 w-4 mr-2" />
        Confirmar pago por transferencia
      </Button>
    </div>
  );

  const renderCreditDetails = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep('method')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Cambiar método
      </Button>
      
      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
        <Clock className="h-6 w-6 text-orange-600" />
        <div>
          <p className="font-semibold">Crédito con proveedor</p>
          <p className="text-sm text-muted-foreground">
            {supplierName} • ${totalAmount.toLocaleString('es-CO')}
          </p>
        </div>
      </div>
      
      <div>
        <Label className="mb-2 block">¿En cuántos días debes pagar?</Label>
        <div className="grid grid-cols-5 gap-2">
          {creditOptions.map((option) => (
            <button
              key={option.days}
              onClick={() => handleCreditDaysSelect(option.days)}
              className={cn(
                "p-3 rounded-lg border-2 text-center transition-all",
                paymentInfo.creditDays === option.days
                  ? "border-primary bg-primary/10 font-semibold"
                  : "border-border hover:border-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="mb-2 block">O selecciona una fecha específica</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {creditDueDate ? format(creditDueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={creditDueDate}
              onSelect={(date) => {
                setCreditDueDate(date);
                setPaymentInfo({ ...paymentInfo, creditDueDate: date });
              }}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {creditDueDate && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⏰ Te recordaremos pagar antes del{' '}
            <strong>{format(creditDueDate, "d 'de' MMMM", { locale: es })}</strong>
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleCreditComplete} 
        className="w-full"
        disabled={!creditDueDate}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Registrar como cuenta por pagar
      </Button>
    </div>
  );

  const renderSplitDetails = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep('method')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Cambiar método
      </Button>
      
      <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
        <SplitSquareHorizontal className="h-6 w-6 text-pink-600" />
        <div>
          <p className="font-semibold">Pago dividido</p>
          <p className="text-sm text-muted-foreground">Total: ${totalAmount.toLocaleString('es-CO')}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label>Monto en efectivo</Label>
          <Input
            type="number"
            placeholder="Ej: 50000"
            value={paymentInfo.splitDetails?.cashAmount || ''}
            onChange={(e) => {
              const cashAmount = Number(e.target.value);
              setPaymentInfo({
                ...paymentInfo,
                splitDetails: {
                  cashAmount,
                  otherAmount: totalAmount - cashAmount,
                  otherMethod: paymentInfo.splitDetails?.otherMethod || 'transfer'
                }
              });
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentInfo({
              ...paymentInfo,
              splitDetails: { ...paymentInfo.splitDetails!, otherMethod: 'transfer' }
            })}
            className={cn(
              "flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2",
              paymentInfo.splitDetails?.otherMethod === 'transfer'
                ? "border-primary bg-primary/10"
                : "border-border"
            )}
          >
            <Smartphone className="h-4 w-4" />
            Transferencia
          </button>
          <button
            onClick={() => setPaymentInfo({
              ...paymentInfo,
              splitDetails: { ...paymentInfo.splitDetails!, otherMethod: 'card' }
            })}
            className={cn(
              "flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2",
              paymentInfo.splitDetails?.otherMethod === 'card'
                ? "border-primary bg-primary/10"
                : "border-border"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Tarjeta
          </button>
        </div>
        
        {paymentInfo.splitDetails?.cashAmount && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Efectivo:</span> ${paymentInfo.splitDetails.cashAmount.toLocaleString('es-CO')}
            </p>
            <p className="text-sm">
              <span className="font-medium">{paymentInfo.splitDetails.otherMethod === 'transfer' ? 'Transferencia' : 'Tarjeta'}:</span> ${paymentInfo.splitDetails.otherAmount.toLocaleString('es-CO')}
            </p>
          </div>
        )}
      </div>
      
      <Button 
        onClick={handleSplitComplete} 
        className="w-full"
        disabled={!paymentInfo.splitDetails?.cashAmount}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Confirmar pago dividido
      </Button>
    </div>
  );

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="pt-6">
        {step === 'method' && renderMethodSelection()}
        {step === 'details' && selectedMethod === 'transfer' && renderTransferDetails()}
        {step === 'details' && selectedMethod === 'credit' && renderCreditDetails()}
        {step === 'details' && selectedMethod === 'split' && renderSplitDetails()}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodFlow;
