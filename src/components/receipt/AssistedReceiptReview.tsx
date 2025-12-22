import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Edit3, Eye, ArrowRight } from 'lucide-react';
import { ReceiptItemEditor, ReceiptItem } from './ReceiptItemEditor';
import { useIngredients } from '@/hooks/useIngredients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PaymentMethodFlow, { PaymentInfo } from '@/components/billing/PaymentMethodFlow';
import { useReceiptAudit, detectSignificantChanges } from '@/hooks/useReceiptAudit';

interface AssistedReceiptReviewProps {
  extractedData: any;
  receiptUrl?: string;
  onComplete: (result: any) => void;
  onSwitchToManual: () => void;
  onCancel: () => void;
}

export const AssistedReceiptReview: React.FC<AssistedReceiptReviewProps> = ({
  extractedData,
  receiptUrl,
  onComplete,
  onSwitchToManual,
  onCancel
}) => {
  const { user, restaurant } = useAuth();
  const { ingredients } = useIngredients();
  const { toast } = useToast();
  const { logBulkEvents, logLowConfidenceAccepted } = useReceiptAudit();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [savedExpenseId, setSavedExpenseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'edit'>('summary');

  // Store original items for audit comparison
  const [originalItems] = useState<any[]>(extractedData?.items || []);

  // Editable items
  const [items, setItems] = useState<ReceiptItem[]>(() => {
    if (extractedData?.items && Array.isArray(extractedData.items)) {
      return extractedData.items.map((item: any, index: number) => ({
        id: `item-${index}`,
        description: item.description || item.matched_ingredient || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'unidades',
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal || 0,
        matched_ingredient_id: item.matched_ingredient_id,
        matched_ingredient_name: item.matched_ingredient || item.description,
        confidence_score: item.confidence_score || extractedData.confidence || 85,
        needs_mapping: item.needs_mapping || false,
        inventory_type: 'ingrediente_receta' as const,
        product_name_on_receipt: item.product_name_on_receipt || item.description
      }));
    }
    return [];
  });

  const [supplierName, setSupplierName] = useState(extractedData?.supplier_name || '');
  const [documentDate] = useState(extractedData?.date || new Date().toISOString().split('T')[0]);

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Identify items needing attention
  const lowConfidenceItems = items.filter(i => i.confidence_score < 80);
  const unmappedItems = items.filter(i => i.needs_mapping);
  const hasIssues = lowConfidenceItems.length > 0 || unmappedItems.length > 0;

  const handleItemChange = (index: number, updates: Partial<ReceiptItem>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAndProcess = async () => {
    if (!user?.id || !restaurant?.id) {
      toast({ title: 'Error', description: 'Sesión no válida', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Detect and log significant changes for audit
      const auditEvents = detectSignificantChanges(originalItems, items);
      
      if (auditEvents.length > 0) {
        await logBulkEvents(auditEvents.map(e => ({ ...e, receiptUrl })));
      }

      // Log if accepting low confidence
      if (extractedData.confidence && extractedData.confidence < 75) {
        await logLowConfidenceAccepted(extractedData.confidence, receiptUrl);
      }

      // Process inventory update
      const { data, error } = await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData: {
            supplier_name: supplierName,
            invoice_number: extractedData.invoice_number,
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
            confidence: extractedData.confidence || 85,
            user_confirmed: true
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
      console.error('Error processing receipt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar. Intenta de nuevo o usa modo manual.',
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
        total: totalAmount
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
      {/* Header with confidence indicator */}
      <Card className={hasIssues ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {hasIssues ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="font-medium">
                  {hasIssues 
                    ? '⚠️ Revisión requerida' 
                    : '✅ Factura procesada correctamente'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {lowConfidenceItems.length > 0 && `${lowConfidenceItems.length} items con baja confianza. `}
                  {unmappedItems.length > 0 && `${unmappedItems.length} items sin mapear.`}
                  {!hasIssues && 'Todos los items fueron reconocidos correctamente.'}
                </p>
              </div>
            </div>
            <Badge variant={hasIssues ? 'secondary' : 'default'}>
              Confianza: {extractedData?.confidence || 85}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Supplier and basic info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Proveedor</span>
              <p className="font-medium">{supplierName || 'No identificado'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Fecha</span>
              <p className="font-medium">{documentDate}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total</span>
              <p className="font-medium text-lg">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle view mode */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setViewMode(viewMode === 'summary' ? 'edit' : 'summary')}
        >
          {viewMode === 'summary' ? (
            <>
              <Edit3 className="h-4 w-4 mr-1" />
              Editar items
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Ver resumen
            </>
          )}
        </Button>
      </div>

      {/* Items - Summary or Edit mode */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Items extraídos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'summary' ? (
            <div className="divide-y">
              {items.map((item, index) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.description}</span>
                      {item.confidence_score < 80 && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">
                          ⚠️ Verificar
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} × ${item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.subtotal.toLocaleString()}</p>
                    <Badge variant="secondary" className="text-xs">
                      {item.confidence_score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <ReceiptItemEditor
                  key={item.id}
                  item={item}
                  index={index}
                  ingredients={ingredients}
                  onChange={handleItemChange}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="ghost" onClick={onSwitchToManual}>
            Usar modo manual
          </Button>
        </div>
        <Button 
          onClick={handleConfirmAndProcess} 
          disabled={isSubmitting || items.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>Procesando...</>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar y actualizar inventario
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AssistedReceiptReview;
