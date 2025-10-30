import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Minus, ShoppingCart, Search, DollarSign } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
}

interface CartItem extends Product {
  quantity: number;
  selectedToppings?: SelectedTopping[];
}

interface Topping {
  id: string;
  name: string;
  price: number;
  cost_price: number;
}

interface SelectedTopping {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const POSSystem = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToppingsDialog, setShowToppingsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);

  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check if this is MOCAI restaurant
  const isMocai = profile?.restaurant_id && user?.email === 'mocai@mocai.com';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProductToppings = async (productId: string) => {
    if (!isMocai || !user) return [];

    try {
      const { data, error } = await supabase
        .from('product_toppings')
        .select(`
          toppings!inner (
            id,
            name,
            price,
            cost_price
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;
      
      return data?.map((item: any) => item.toppings).filter(Boolean) || [];
    } catch (error) {
      console.error('Error loading product toppings:', error);
      return [];
    }
  };

  const loadProducts = async () => {
    try {
      if (!profile?.restaurant_id) {
        console.error('No restaurant_id found for current user profile:', profile);
        throw new Error("No se encontró el restaurante del usuario");
      }

      console.log('Loading products for restaurant_id:', profile.restaurant_id);
      console.log('Current user profile:', profile);

      // Obtener productos visibles por RLS del mismo restaurante
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          user_id,
          category:categories(name),
          inventory(current_stock, unit)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Supabase error loading products:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Raw products data from database:', data);
      console.log('Number of products found:', data?.length || 0);

      if (!data || data.length === 0) {
        console.warn('No products found for restaurant_id:', profile.restaurant_id);
      }

      const formattedProducts = data?.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name || 'General',
        stock: product.inventory?.[0]?.current_stock || 0,
        unit: product.inventory?.[0]?.unit || 'unidades'
      })) || [];

      console.log('Formatted products for POS:', formattedProducts);
      console.log('Setting products state with', formattedProducts.length, 'items');
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  };

  const addToCart = async (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Sin stock",
        description: `${product.name} no tiene stock disponible`,
        variant: "destructive"
      });
      return;
    }

    // If it's MOCAI, check for available toppings
    if (isMocai) {
      const toppings = await loadProductToppings(product.id);
      if (toppings.length > 0) {
        setSelectedProduct(product);
        setAvailableToppings(toppings);
        setSelectedToppings([]);
        setShowToppingsDialog(true);
        return;
      }
    }

    // Add product without toppings
    addProductToCart(product, []);
  };

  const addProductToCart = (product: Product, toppings: SelectedTopping[]) => {
    const existingItem = cart.find(item => 
      item.id === product.id && 
      JSON.stringify(item.selectedToppings || []) === JSON.stringify(toppings)
    );
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item.id === product.id && 
          JSON.stringify(item.selectedToppings || []) === JSON.stringify(toppings)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${product.stock} unidades disponibles`,
          variant: "destructive"
        });
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, selectedToppings: toppings }]);
    }
  };

  const handleAddWithToppings = () => {
    if (selectedProduct) {
      addProductToCart(selectedProduct, selectedToppings);
      setShowToppingsDialog(false);
      setSelectedProduct(null);
      setSelectedToppings([]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== productId));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const productTotal = item.price * item.quantity;
      const toppingsTotal = (item.selectedToppings || []).reduce(
        (toppingSum, topping) => toppingSum + (topping.price * topping.quantity * item.quantity), 
        0
      );
      return total + productTotal + toppingsTotal;
    }, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de procesar la venta",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Método de pago requerido",
        description: "Selecciona un método de pago",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Crear la venta
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          total_amount: calculateTotal(),
          payment_method: paymentMethod,
          customer_email: customerEmail || null,
          table_number: tableNumber ? parseInt(tableNumber) : null,
          status: 'completed'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Crear items de la venta
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)
        .select();

      if (itemsError) throw itemsError;

      // Create topping records for MOCAI
      if (isMocai && saleItemsData) {
        const toppingRecords = [];
        
        for (let i = 0; i < cart.length; i++) {
          const cartItem = cart[i];
          const saleItem = saleItemsData[i];
          
          if (cartItem.selectedToppings) {
            for (const topping of cartItem.selectedToppings) {
              toppingRecords.push({
                sale_item_id: saleItem.id,
                topping_id: topping.id,
                quantity: topping.quantity * cartItem.quantity,
                unit_price: topping.price,
                subtotal: topping.price * topping.quantity * cartItem.quantity
              });
            }
          }
        }

        if (toppingRecords.length > 0) {
          const { error: toppingsError } = await supabase
            .from('sale_item_toppings')
            .insert(toppingRecords);

          if (toppingsError) throw toppingsError;

          // Update topping inventory (subtract sold quantities)
          for (const record of toppingRecords) {
            // Get current stock first
            const { data: inventory } = await supabase
              .from('inventory')
              .select('current_stock')
              .eq('product_id', record.topping_id)
              .single();

            if (inventory) {
              const newStock = Math.max(0, inventory.current_stock - record.quantity);
              const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                  current_stock: newStock,
                  last_updated: new Date().toISOString()
                })
                .eq('product_id', record.topping_id);

              if (updateError) console.error('Error updating topping inventory:', updateError);
            }

            // Create inventory movement for topping
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: record.topping_id,
                movement_type: 'OUT',
                quantity: record.quantity,
                reference_type: 'SALE',
                reference_id: saleData.id,
                notes: `Venta topping - Factura ID: ${saleData.id}`
              });
          }
        }
      }

      toast({
        title: "Venta procesada",
        description: `Venta por $${calculateTotal().toFixed(2)} procesada exitosamente`,
      });

      // Limpiar el carrito y recargar productos
      clearCart();
      setPaymentMethod('');
      setCustomerEmail('');
      setTableNumber('');
      loadProducts();

    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema de Ventas (POS)</h2>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <Badge variant="secondary">
            {cart.length} artículos
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Disponibles</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-primary">
                            ${product.price.toFixed(2)}
                          </span>
                          <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                            {product.stock > 0 ? `${product.stock} ${product.unit}` : 'Sin stock'}
                          </Badge>
                        </div>
                        <Button 
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="w-full"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron productos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Carrito de Compras
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Limpiar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.selectedToppings || [])}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground font-medium">Toppings:</p>
                          {item.selectedToppings.map((topping, index) => (
                            <p key={index} className="text-xs text-muted-foreground ml-2">
                              • {topping.name} (+${topping.price.toFixed(2)} × {topping.quantity})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCart(cart.filter(cartItem => !(cartItem.id === item.id && JSON.stringify(cartItem.selectedToppings || []) === JSON.stringify(item.selectedToppings || []))))}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    El carrito está vacío
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Checkout Section */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Procesar Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tableNumber">Número de Mesa (Opcional)</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ej: 5"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email del Cliente (Opcional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={processSale}
                  disabled={isProcessing || !paymentMethod}
                  className="w-full"
                >
                  {isProcessing ? 'Procesando...' : 'Procesar Venta'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Toppings Selection Dialog */}
      <Dialog open={showToppingsDialog} onOpenChange={setShowToppingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Toppings para {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableToppings.map((topping) => {
              const selected = selectedToppings.find(t => t.id === topping.id);
              return (
                <div key={topping.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!selected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedToppings(prev => [...prev, {
                            id: topping.id,
                            name: topping.name,
                            price: topping.price,
                            quantity: 1
                          }]);
                        } else {
                          setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium">{topping.name}</p>
                      <p className="text-sm text-muted-foreground">${topping.price.toFixed(2)}</p>
                    </div>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedToppings(prev => 
                            prev.map(t => 
                              t.id === topping.id && t.quantity > 1
                                ? { ...t, quantity: t.quantity - 1 }
                                : t
                            )
                          );
                        }}
                        disabled={selected.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{selected.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedToppings(prev => 
                            prev.map(t => 
                              t.id === topping.id && t.quantity < 10
                                ? { ...t, quantity: t.quantity + 1 }
                                : t
                            )
                          );
                        }}
                        disabled={selected.quantity >= 10}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowToppingsDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddWithToppings}>
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSSystem;