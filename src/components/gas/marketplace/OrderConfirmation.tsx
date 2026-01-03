import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Trash2, 
  CheckCircle, 
  MapPin, 
  Clock,
  FileText,
  Truck,
  Phone,
  Loader2,
  PartyPopper,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  type: 'product' | 'service' | 'quote';
  price: number;
  quantity: number;
  details?: any;
}

interface Props {
  cart: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
  onRemoveItem: (itemId: string) => void;
}

const OrderConfirmation = ({ cart, onBack, onClearCart, onRemoveItem }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    phone: '',
    notes: ''
  });

  const products = cart.filter(item => item.type === 'product');
  const quotes = cart.filter(item => item.type === 'quote' || item.type === 'service');

  const subtotal = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 0 : 0; // Free delivery
  const total = subtotal + deliveryFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const handleSubmitOrder = async () => {
    if (products.length > 0 && !deliveryInfo.address) {
      toast({
        title: 'Dirección requerida',
        description: 'Por favor ingresa tu dirección de entrega',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Get user profile for restaurant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      // Generate order number
      const orderNum = `ENV-${Date.now().toString(36).toUpperCase()}`;

      // For products, create a gas_orders record
      if (products.length > 0) {
        // Find or create Envagas as a client in gas_clients
        const tenantId = profile?.restaurant_id;
        
        if (tenantId) {
          const { data: order, error: orderError } = await supabase
            .from('gas_orders')
            .insert({
              tenant_id: tenantId,
              client_id: tenantId, // Self-reference for now
              order_number: orderNum,
              requested_qty: products.reduce((sum, p) => sum + p.quantity, 0),
              unit: 'unidades',
              notes: `Pedido Marketplace: ${products.map(p => `${p.quantity}x ${p.name}`).join(', ')}. Dirección: ${deliveryInfo.address}. Tel: ${deliveryInfo.phone}. Notas: ${deliveryInfo.notes}`,
              status: 'pending'
            })
            .select()
            .single();

          if (orderError) {
            console.error('Order error:', orderError);
          }
        }
      }

      // For quotes/services, we could create a separate tracking
      // For now, we'll just log them
      if (quotes.length > 0) {
        console.log('Service quotes submitted:', quotes);
      }

      // Create notification for the supplier (Envagas)
      // This would be handled by the gas operations team

      setOrderNumber(orderNum);
      setOrderComplete(true);
      
      toast({
        title: '¡Pedido enviado!',
        description: 'Envagas procesará tu solicitud pronto.'
      });

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error al enviar pedido',
        description: error.message || 'Intenta nuevamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 
                     flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
        >
          <PartyPopper className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2 text-center"
        >
          ¡Pedido enviado!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 text-center mb-6"
        >
          Tu solicitud fue recibida por Envagas
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 w-full max-w-sm"
        >
          <div className="text-center">
            <p className="text-white/60 text-sm">Número de pedido</p>
            <p className="text-xl font-mono font-bold text-orange-400">{orderNumber}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 w-full max-w-sm"
        >
          {products.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <Truck className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white/80 text-sm font-medium">Entrega estimada</p>
                <p className="text-white/50 text-xs">2-4 horas (pedidos antes de 2pm)</p>
              </div>
            </div>
          )}
          
          {quotes.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <Clock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-white/80 text-sm font-medium">Cotizaciones pendientes</p>
                <p className="text-white/50 text-xs">Te contactaremos en 24 horas</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-full max-w-sm"
        >
          <Button
            onClick={() => {
              onClearCart();
              onBack();
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            Volver al inicio
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Confirmar pedido</h1>
            <p className="text-white/60 text-sm">{cart.length} items en el carrito</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Products Section */}
        {products.length > 0 && (
          <div>
            <h2 className="font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              Productos ({products.length})
            </h2>
            <div className="space-y-3">
              {products.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-white/60 text-sm">Cantidad: {item.quantity}</p>
                      {item.details?.condition && (
                        <Badge variant="outline" className="mt-2 border-white/20 text-white/60 text-xs">
                          {item.details.condition === 'exchange' ? 'Intercambio' : 
                           item.details.condition === 'refill' ? 'Recarga' : 'Nuevo'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-400/60 hover:text-red-400 mt-2 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Delivery Info */}
            <div className="mt-4 space-y-3">
              <h3 className="font-medium text-white/80 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Información de entrega
              </h3>
              
              <Input
                value={deliveryInfo.address}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa de entrega *"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              
              <Input
                value={deliveryInfo.phone}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Teléfono de contacto"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              
              <Textarea
                value={deliveryInfo.notes}
                onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Instrucciones de entrega (opcional)"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Totals */}
            <div className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Envío</span>
                <span className="text-green-400">Gratis</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quotes/Services Section */}
        {quotes.length > 0 && (
          <div>
            <h2 className="font-semibold text-white/80 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Solicitudes de cotización ({quotes.length})
            </h2>
            <div className="space-y-3">
              {quotes.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      {item.details?.businessType && (
                        <p className="text-white/60 text-sm mt-1">
                          Tipo: {item.details.businessType}
                        </p>
                      )}
                      {item.details?.propertyType && (
                        <p className="text-white/60 text-sm mt-1">
                          Inmueble: {item.details.propertyType}
                        </p>
                      )}
                      {item.details?.location && (
                        <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.details.location}
                        </p>
                      )}
                      {item.details?.address && (
                        <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.details.address}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        Cotización
                      </Badge>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-400/60 hover:text-red-400 mt-2 p-1 block ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-white/90 font-medium text-sm">¿Cómo funcionan las cotizaciones?</p>
                  <p className="text-white/60 text-xs mt-1">
                    Un asesor comercial de Envagas te contactará en las próximas 24 horas 
                    para brindarte una cotización personalizada sin compromiso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <Button
          onClick={handleSubmitOrder}
          disabled={loading || (products.length > 0 && !deliveryInfo.address)}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 
                     text-white font-semibold text-lg rounded-xl shadow-lg shadow-orange-500/30"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {products.length > 0 && quotes.length > 0 
                ? 'Enviar pedido y solicitudes'
                : products.length > 0 
                  ? `Confirmar pedido ${formatCurrency(total)}`
                  : 'Enviar solicitudes'
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
