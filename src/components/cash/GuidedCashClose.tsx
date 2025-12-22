import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GuidedCashCloseProps {
  cashRegisterId: string;
  openingBalance: number;
  totalSales: number;
  totalExpenses: number;
  cashPayments: number;
  cashIncomes: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'summary' | 'count' | 'result';

const GuidedCashClose = ({
  cashRegisterId,
  openingBalance,
  totalSales,
  totalExpenses,
  cashPayments,
  cashIncomes,
  onClose,
  onSuccess
}: GuidedCashCloseProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('summary');
  const [actualCash, setActualCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate expected cash
  const expectedCash = openingBalance + totalSales - totalExpenses - cashPayments + cashIncomes;
  const actualAmount = parseFloat(actualCash) || 0;
  const difference = actualAmount - expectedCash;

  const handleSubmit = async () => {
    if (!cashRegisterId || !profile?.id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({
          final_cash: actualAmount,
          cash_difference: difference,
          is_closed: true,
          closed_at: new Date().toISOString(),
          closed_by: profile.id
        })
        .eq('id', cashRegisterId);

      if (error) throw error;

      toast({
        title: "Caja cerrada exitosamente",
        description: difference === 0 
          ? "¡Perfecto! El cuadre está exacto."
          : `Diferencia registrada: ${formatCurrency(difference)}`
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error closing cash register:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la caja",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      {step === 'summary' && (
        <div className="space-y-6">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto text-primary mb-2" />
            <h2 className="text-xl font-bold">Cierre de Caja</h2>
            <p className="text-muted-foreground text-sm">Vamos a cuadrar paso a paso</p>
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Abriste caja con:</span>
              <span className="font-semibold">{formatCurrency(openingBalance)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>+ Ventas en efectivo:</span>
              <span className="font-semibold">{formatCurrency(totalSales)}</span>
            </div>
            {cashIncomes > 0 && (
              <div className="flex justify-between text-green-600">
                <span>+ Otros ingresos:</span>
                <span className="font-semibold">{formatCurrency(cashIncomes)}</span>
              </div>
            )}
            <div className="flex justify-between text-red-600">
              <span>- Gastos:</span>
              <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
            </div>
            {cashPayments > 0 && (
              <div className="flex justify-between text-red-600">
                <span>- Pagos en efectivo:</span>
                <span className="font-semibold">{formatCurrency(cashPayments)}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Deberías tener:</span>
                <span className="font-bold text-primary">{formatCurrency(expectedCash)}</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setStep('count')} 
            className="w-full"
            size="lg"
          >
            Entendido, vamos a contar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 'count' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">¿Cuánto tienes realmente?</h2>
            <p className="text-muted-foreground text-sm">
              Cuenta el efectivo en caja y escribe el total
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Esperado:</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(expectedCash)}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Efectivo contado:</label>
            <Input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="0"
              className="text-2xl text-center h-14"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('summary')}
              className="flex-1"
            >
              Atrás
            </Button>
            <Button 
              onClick={() => setStep('result')}
              className="flex-1"
              disabled={!actualCash}
            >
              Ver resultado
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          <div className="text-center">
            {difference === 0 ? (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-2" />
                <h2 className="text-xl font-bold text-green-600">¡Cuadre perfecto!</h2>
                <p className="text-muted-foreground">La caja coincide exactamente</p>
              </>
            ) : difference > 0 ? (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-blue-500 mb-2" />
                <h2 className="text-xl font-bold">Hay un sobrante</h2>
                <p className="text-muted-foreground">Tienes más de lo esperado</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-2" />
                <h2 className="text-xl font-bold">Hay un faltante</h2>
                <p className="text-muted-foreground">Falta dinero en caja</p>
              </>
            )}
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between">
              <span>Esperado:</span>
              <span className="font-semibold">{formatCurrency(expectedCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Contado:</span>
              <span className="font-semibold">{formatCurrency(actualAmount)}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Diferencia:</span>
                <Badge 
                  className={
                    difference === 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : difference > 0 
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }
                >
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('count')}
              className="flex-1"
            >
              Recontar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cerrar caja
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GuidedCashClose;
