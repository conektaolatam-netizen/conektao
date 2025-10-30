import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Save, 
  AlertTriangle,
  Calculator,
  ShoppingCart,
  DollarSign,
  Edit3
} from 'lucide-react';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  customer_email: string;
  table_number: number;
  created_at: string;
  status: string;
  user_id: string;
  sale_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product_id: string;
    products: {
      id: string;
      name: string;
      price: number;
    };
  }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
}

interface InvoiceEditorProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onSaleUpdated: () => void;
}

const InvoiceEditor = ({ sale, isOpen, onClose, onSaleUpdated }: InvoiceEditorProps) => {
  const [editedItems, setEditedItems] = useState(sale?.sale_items || []);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (sale) {
      setEditedItems([...sale.sale_items]);
      loadProducts();
    }
  }, [sale]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setEditedItems(items => 
      items.map(item => {
        if (item.id === itemId) {
          const newSubtotal = item.unit_price * newQuantity;
          return { ...item, quantity: newQuantity, subtotal: newSubtotal };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setEditedItems(items => items.filter(item => item.id !== itemId));
  };

  const addNewItem = () => {
    if (!selectedProductId) return;

    const product = availableProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem = {
      id: `temp_${Date.now()}`,
      quantity: newItemQuantity,
      unit_price: product.price,
      subtotal: product.price * newItemQuantity,
      product_id: product.id,
      products: {
        id: product.id,
        name: product.name,
        price: product.price
      }
    };

    setEditedItems(items => [...items, newItem]);
    setSelectedProductId('');
    setNewItemQuantity(1);
  };

  const calculateNewTotal = () => {
    const subtotal = editedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const impoconsumo = Math.round(subtotal * 0.08); // 8% impoconsumo
    return subtotal + impoconsumo;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const updateCashRegister = async (oldTotal: number, newTotal: number) => {
    try {
      const saleDate = new Date(sale!.created_at).toISOString().split('T')[0];
      
      // Get cash register for the sale date
      const { data: cashRegister } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('restaurant_id', profile?.restaurant_id)
        .eq('date', saleDate)
        .eq('is_closed', false)
        .maybeSingle();

      if (cashRegister) {
        const difference = newTotal - oldTotal;
        const newCurrentCash = Number(cashRegister.current_cash || 0) + difference;

        await supabase
          .from('cash_registers')
          .update({ 
            current_cash: newCurrentCash,
            updated_at: new Date().toISOString()
          })
          .eq('id', cashRegister.id);
      }
    } catch (error) {
      console.error('Error updating cash register:', error);
    }
  };

  const saveChanges = async () => {
    if (!sale) return;
    
    setLoading(true);
    try {
      const oldTotal = sale.total_amount;
      const newTotal = calculateNewTotal();

      // Update sale total
      const { error: saleError } = await supabase
        .from('sales')
        .update({ 
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', sale.id);

      if (deleteError) throw deleteError;

      // Insert updated sale items
      const itemsToInsert = editedItems.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      // Update cash register if payment was cash
      if (sale.payment_method === 'efectivo') {
        await updateCashRegister(oldTotal, newTotal);
      }

      toast({
        title: "✅ Factura actualizada",
        description: `Total actualizado: ${formatCurrency(newTotal)}`,
      });

      onSaleUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar la factura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async () => {
    if (!sale || !deleteReason.trim()) return;
    
    setLoading(true);
    try {
      // Update cash register if payment was cash
      if (sale.payment_method === 'efectivo') {
        await updateCashRegister(sale.total_amount, 0);
      }

      // Delete sale items first
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', sale.id);

      if (itemsError) throw itemsError;

      // Delete sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // Log deletion reason
      console.log(`Sale ${sale.id} deleted by ${profile?.full_name}. Reason: ${deleteReason}`);

      toast({
        title: "🗑️ Factura eliminada",
        description: "La factura ha sido eliminada correctamente",
      });

      onSaleUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar la factura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (!sale) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Editar Factura #{sale.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Sale Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email del Cliente</Label>
                    <Input value={sale.customer_email || 'Sin email'} disabled />
                  </div>
                  <div>
                    <Label>Método de Pago</Label>
                    <Input value={sale.payment_method} disabled />
                  </div>
                  <div>
                    <Label>Mesa</Label>
                    <Input value={sale.table_number?.toString() || 'N/A'} disabled />
                  </div>
                  <div>
                    <Label>Total Original</Label>
                    <Input value={formatCurrency(sale.total_amount)} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.products.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price)} c/u
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={editedItems.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add New Product */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                      min="1"
                      placeholder="Cant."
                    />
                    <Button 
                      onClick={addNewItem}
                      disabled={!selectedProductId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen de Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(editedItems.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Impoconsumo (8%):</span>
                    <span>{formatCurrency(Math.round(editedItems.reduce((sum, item) => sum + item.subtotal, 0) * 0.08))}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Nuevo:</span>
                    <span className="text-primary">{formatCurrency(calculateNewTotal())}</span>
                  </div>
                  {calculateNewTotal() !== sale.total_amount && (
                    <div className="flex justify-between text-sm">
                      <span>Diferencia:</span>
                      <span className={calculateNewTotal() > sale.total_amount ? 'text-green-600' : 'text-red-600'}>
                        {calculateNewTotal() > sale.total_amount ? '+' : ''}
                        {formatCurrency(calculateNewTotal() - sale.total_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <div>
                {isOwner && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Factura
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={saveChanges}
                  disabled={loading || JSON.stringify(editedItems) === JSON.stringify(sale.sale_items)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.</p>
            <div>
              <Label htmlFor="deleteReason">Motivo de eliminación (obligatorio)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explica por qué estás eliminando esta factura..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteSale}
                disabled={!deleteReason.trim() || loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Factura'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceEditor;