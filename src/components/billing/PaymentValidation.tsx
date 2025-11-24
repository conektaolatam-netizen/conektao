import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentValidationProps {
  open: boolean;
  onClose: () => void;
  onValidated: (voucherUrl: string, validation: any) => void;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata';
  expectedAmount: number;
  restaurantId: string;
}

export const PaymentValidation = ({
  open,
  onClose,
  onValidated,
  paymentMethod,
  expectedAmount,
  restaurantId
}: PaymentValidationProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Solo se permiten imágenes',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('transfer-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('transfer-photos')
        .getPublicUrl(fileName);

      setVoucherUrl(urlData.publicUrl);
      toast({
        title: 'Imagen cargada',
        description: 'Validando con IA...'
      });

      // Validar con IA
      await validateVoucher(urlData.publicUrl);

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar imagen',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const validateVoucher = async (url: string) => {
    setValidating(true);
    try {
      // Obtener cuenta del restaurante para este método de pago
      const { data: accounts } = await supabase
        .from('business_payment_accounts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .limit(1);

      const accountId = accounts?.[0]?.id;

      const { data, error } = await supabase.functions.invoke('validate-payment-voucher', {
        body: {
          voucherUrl: url,
          paymentMethod,
          expectedAmount,
          restaurantAccountId: accountId
        }
      });

      if (error) throw error;

      setValidation(data);

      if (data.recommendation === 'approved') {
        toast({
          title: 'Pago validado',
          description: `Voucher aprobado automáticamente (${data.confidence}% confianza)`,
          className: 'bg-green-500 text-white'
        });
      } else if (data.recommendation === 'manual_review') {
        toast({
          title: 'Revisión manual requerida',
          description: 'El voucher necesita verificación manual',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Pago rechazado',
          description: 'El voucher no pasó la validación',
          variant: 'destructive'
        });
      }

    } catch (error: any) {
      console.error('Error validating voucher:', error);
      toast({
        title: 'Error',
        description: 'Error al validar voucher con IA',
        variant: 'destructive'
      });
      // Set manual review as fallback
      setValidation({
        isValid: false,
        recommendation: 'manual_review',
        issues: ['Error en validación automática']
      });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < expectedAmount) {
        toast({
          title: 'Error',
          description: 'Monto recibido inválido',
          variant: 'destructive'
        });
        return;
      }
      onValidated('', { method: 'efectivo', received, change: received - expectedAmount });
    } else if (voucherUrl && validation) {
      onValidated(voucherUrl, validation);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Validación de Pago - {formatCurrency(expectedAmount)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {paymentMethod === 'efectivo' ? (
            <div className="space-y-4">
              <div>
                <Label>Monto total a pagar</Label>
                <Input
                  value={formatCurrency(expectedAmount)}
                  disabled
                  className="font-bold text-lg"
                />
              </div>
              <div>
                <Label>Monto recibido del cliente</Label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Ej: 20000"
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= expectedAmount && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-bold">Cambio: </span>
                    {formatCurrency(parseFloat(cashReceived) - expectedAmount)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sube una foto del voucher o comprobante de {paymentMethod}.
                  La IA verificará automáticamente el monto y la cuenta.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                
                {!voucherUrl ? (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir imagen
                      </Button>
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Subiendo...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img src={voucherUrl} alt="Voucher" className="max-h-64 mx-auto rounded" />
                    {validating && (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Validando con IA...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {validation && !validating && (
                <Alert className={
                  validation.recommendation === 'approved' ? 'bg-green-50 border-green-500' :
                  validation.recommendation === 'rejected' ? 'bg-red-50 border-red-500' :
                  'bg-yellow-50 border-yellow-500'
                }>
                  {validation.recommendation === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {validation.recommendation === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                  {validation.recommendation === 'manual_review' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-bold">
                        {validation.recommendation === 'approved' && 'Pago aprobado'}
                        {validation.recommendation === 'rejected' && 'Pago rechazado'}
                        {validation.recommendation === 'manual_review' && 'Requiere revisión manual'}
                      </p>
                      {validation.confidence && (
                        <p className="text-sm">Confianza: {validation.confidence}%</p>
                      )}
                      {validation.detectedAmount && (
                        <p className="text-sm">Monto detectado: {formatCurrency(validation.detectedAmount)}</p>
                      )}
                      {validation.issues && validation.issues.length > 0 && (
                        <div className="text-sm">
                          <p className="font-semibold">Observaciones:</p>
                          <ul className="list-disc list-inside">
                            {validation.issues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                paymentMethod === 'efectivo' 
                  ? !cashReceived || parseFloat(cashReceived) < expectedAmount
                  : !voucherUrl || validating
              }
            >
              Confirmar pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};