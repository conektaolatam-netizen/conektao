import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, AlertTriangle, FileText, ImageIcon } from 'lucide-react';
import { ReceiptItemEditor, ReceiptItem } from './ReceiptItemEditor';
import { useIngredients } from '@/hooks/useIngredients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PaymentMethodFlow, { PaymentInfo } from '@/components/billing/PaymentMethodFlow';
import { useReceiptAudit } from '@/hooks/useReceiptAudit';

interface ManualReceiptFormProps {
  receiptUrl?: string;
  fallbackReason: 'low_confidence' | 'handwritten' | 'user_requested' | 'ai_error';
  partialData?: any;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export const ManualReceiptForm: React.FC<ManualReceiptFormProps> = ({
  receiptUrl,
  fallbackReason,
  partialData,
  onComplete,
  onCancel
}) => {
  const { user, restaurant } = useAuth();
  const { ingredients, loading: ingredientsLoading } = useIngredients();
  const { toast } = useToast();
  const { logManualFallback } = useReceiptAudit();

  // Form state
  const [supplierName, setSupplierName] = useState(partialData?.supplier_name || '');
  const [documentDate, setDocumentDate] = useState(
    partialData?.date || new Date().toISOString().split('T')[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState(partialData?.invoice_number || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [savedExpenseId, setSavedExpenseId] = useState<string | null>(null);

  // Items state
  const [items, setItems] = useState<ReceiptItem[]>(() => {
    if (partialData?.items && Array.isArray(partialData.items)) {
      return partialData.items.map((item: any, index: number) => ({
        id: `item-${index}`,
        description: item.description || item.product_name_on_receipt || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'unidades',
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal || 0,
        matched_ingredient_id: undefined,
        matched_ingredient_name: undefined,
        confidence_score: item.confidence_score || 0,
        needs_mapping: true,
        inventory_type: 'ingrediente_receta' as const,
        product_name_on_receipt: item.product_name_on_receipt || item.description
      }));
    }
    return [];
  });

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleItemChange = (index: number, updates: Partial<ReceiptItem>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'unidades',
      unit_price: 0,
      subtotal: 0,
      confidence_score: 100,
      needs_mapping: true,
      inventory_type: 'ingrediente_receta'
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleSaveAndContinue = async () => {
    if (!user?.id || !restaurant?.id) {
      toast({ title: 'Error', description: 'Sesión no válida', variant: 'destructive' });
      return;
    }

    if (!supplierName.trim()) {
      toast({ title: 'Falta información', description: 'Ingresa el nombre del proveedor', variant: 'destructive' });
      return;
    }

    if (items.length === 0) {
      toast({ title: 'Falta información', description: 'Agrega al menos un item', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Log manual fallback event
      await logManualFallback(
        `Fallback manual usado: ${fallbackReason}. Proveedor: ${supplierName}`,
        receiptUrl
      );

      // Call the update function
      const { data, error } = await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData: {
            supplier_name: supplierName,
            invoice_number: invoiceNumber,
            date: documentDate,
            total: totalAmount,
            items: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              matched_ingredient_id: item.matched_ingredient_id,
              inventory_type: item.inventory_type,
              product_name_on_receipt: item.product_name_on_receipt
            })),
            confidence: 100, // Manual entry = 100% confidence
            manual_entry: true,
            fallback_reason: fallbackReason
          },
          userId: user.id,
          receiptUrl
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Inventario actualizado',
        description: `${data.summary?.ingredients_updated || 0} actualizados, ${data.summary?.ingredients_created || 0} nuevos`,
      });

      setSavedExpenseId(data.expense_id);
      setShowPayment(true);

    } catch (error: any) {
      console.error('Error saving manual receipt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = async (paymentInfo: PaymentInfo) => {
    try {
      await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData: {
            supplier_name: supplierName,
            total: totalAmount
          },
          userId: user?.id,
          receiptUrl,
          paymentInfo,
          paymentOnly: true
        }
      });

      toast({
        title: '🎉 Factura completada',
        description: 'Inventario y pago registrados correctamente'
      });

      onComplete({
        expense_id: savedExpenseId,
        items_count: items.length,
        total: totalAmount,
        manual: true
      });

    } catch (error) {
      console.error('Error registering payment:', error);
      toast({
        title: 'Error al registrar pago',
        description: 'El inventario se actualizó pero el pago no se registró',
        variant: 'destructive'
      });
    }
  };

  const fallbackMessages: Record<string, { title: string; description: string }> = {
    low_confidence: {
      title: '⚠️ Confianza baja en la lectura',
      description: 'La IA no pudo leer claramente la factura. Completa los datos manualmente.'
    },
    handwritten: {
      title: '✍️ Factura manuscrita detectada',
      description: 'Esta parece ser una factura escrita a mano. Ingresa los datos manualmente.'
    },
    user_requested: {
      title: '📝 Modo manual activado',
      description: 'Ingresa los datos de la factura manualmente.'
    },
    ai_error: {
      title: '🔄 Error de procesamiento',
      description: 'Hubo un problema al procesar la factura. Puedes ingresarla manualmente.'
    }
  };

  const message = fallbackMessages[fallbackReason];

  if (showPayment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Registrar método de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodFlow
            totalAmount={totalAmount}
            supplierName={supplierName}
            onComplete={handlePaymentComplete}
            onCancel={() => {
              toast({
                title: '⚠️ Pago no registrado',
                description: 'El inventario se actualizó pero el pago quedó pendiente'
              });
              onComplete({ expense_id: savedExpenseId, payment_pending: true });
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fallback reason banner */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">{message.title}</p>
              <p className="text-sm text-amber-700">{message.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt image preview */}
      {receiptUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Imagen de referencia</span>
            </div>
            <img 
              src={receiptUrl} 
              alt="Factura" 
              className="max-h-48 rounded border object-contain"
            />
          </CardContent>
        </Card>
      )}

      {/* Main form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Datos de la factura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Proveedor *</label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nombre del proveedor"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número de factura</label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre esta factura..."
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📦 Items de la factura</CardTitle>
            <Button onClick={handleAddItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay items agregados</p>
              <Button onClick={handleAddItem} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Agregar primer item
              </Button>
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <ReceiptItemEditor
                  key={item.id}
                  item={item}
                  index={index}
                  ingredients={ingredients}
                  onChange={handleItemChange}
                  onDelete={handleDeleteItem}
                  showConfidence={false}
                />
              ))}
            </>
          )}

          {/* Total */}
          {items.length > 0 && (
            <div className="flex justify-end items-center gap-4 pt-4 border-t">
              <span className="font-medium">Total:</span>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                ${totalAmount.toLocaleString()}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveAndContinue} 
          disabled={isSubmitting || items.length === 0 || !supplierName.trim()}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar y continuar al pago
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ManualReceiptForm;
