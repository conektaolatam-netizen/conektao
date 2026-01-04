import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  Factory, 
  Wrench, 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Shield, 
  Phone,
  ChevronRight,
  Flame,
  CheckCircle,
  Star,
  Truck,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ResidentialProducts from './ResidentialProducts';
import StorageSolutions from './StorageSolutions';
import TechnicalServices from './TechnicalServices';
import OrderConfirmation from './OrderConfirmation';

type ViewType = 'home' | 'residential' | 'storage' | 'technical' | 'confirm';

interface CartItem {
  id: string;
  name: string;
  type: 'product' | 'service' | 'quote';
  price: number;
  quantity: number;
  details?: any;
}

const EnvagasMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    {
      id: 'residential',
      icon: Home,
      title: 'Soluciones Residenciales',
      subtitle: 'Cilindros GLP para hogares',
      description: 'Cilindros de 20, 30, 40 y 100 libras. Entrega rápida y segura.',
      gradient: 'from-orange-500 to-amber-600',
      bgGlow: 'bg-orange-500/20',
      items: '4 productos'
    },
    {
      id: 'storage',
      icon: Factory,
      title: 'Soluciones de Almacenamiento',
      subtitle: 'B2B e Industrial',
      description: 'Tanques estacionarios, suministro por cisterna y más.',
      gradient: 'from-cyan-500 to-blue-600',
      bgGlow: 'bg-cyan-500/20',
      items: '5 servicios'
    },
    {
      id: 'technical',
      icon: Wrench,
      title: 'Servicio Técnico',
      subtitle: 'Instalaciones y certificaciones',
      description: 'Diseño, construcción y mantenimiento de redes GLP.',
      gradient: 'from-slate-500 to-slate-700',
      bgGlow: 'bg-slate-500/20',
      items: '6 servicios'
    }
  ];

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    toast({
      title: item.type === 'quote' ? 'Solicitud agregada' : 'Producto agregado',
      description: `${item.name} agregado al carrito`
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasQuotes = cart.some(item => item.type === 'quote');

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setCurrentView('confirm');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'residential':
        return <ResidentialProducts onAddToCart={addToCart} onBack={() => setCurrentView('home')} />;
      case 'storage':
        return <StorageSolutions onAddToCart={addToCart} onBack={() => setCurrentView('home')} />;
      case 'technical':
        return <TechnicalServices onAddToCart={addToCart} onBack={() => setCurrentView('home')} />;
      case 'confirm':
        return (
          <OrderConfirmation 
            cart={cart} 
            onBack={() => setCurrentView('home')} 
            onClearCart={clearCart}
            onRemoveItem={removeFromCart}
          />
        );
      default:
        return null;
    }
  };

  if (currentView !== 'home') {
    return (
      <div className="min-h-screen bg-black">
        {renderContent()}
        
        {/* Floating Cart Button */}
        {cart.length > 0 && currentView !== 'confirm' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              onClick={handleSubmitOrder}
              className="h-14 px-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 
                         text-white font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-3"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Ver carrito ({cart.length})</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cartTotal)}
              </span>
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/gas')}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm">Volver al Dashboard</span>
        </div>
      </div>

      {/* Header - Envagas Profile */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-8">
          {/* Logo and Badge */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 
                           flex items-center justify-center shadow-lg shadow-orange-500/30"
              >
                <Flame className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  ENVAGAS
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                </h1>
                <p className="text-white/60">Distribuidora de GLP</p>
              </div>
            </div>
            
            {/* Cart indicator */}
            {cart.length > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleSubmitOrder}
                className="relative p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30"
              >
                <ShoppingCart className="w-6 h-6 text-orange-400" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              </motion.button>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                Ubicación
              </div>
              <p className="text-white font-medium">Ibagué, Tolima</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Horario
              </div>
              <p className="text-white font-medium">7am - 6pm</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <Truck className="w-4 h-4" />
                Cobertura
              </div>
              <p className="text-white font-medium">Tolima & Huila</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                Calificación
              </div>
              <p className="text-white font-medium">4.9 (234 reseñas)</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10">
              <CheckCircle className="w-3 h-3 mr-1" />
              +30 años de experiencia
            </Badge>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
              <CheckCircle className="w-3 h-3 mr-1" />
              Certificados SIC
            </Badge>
            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
              <CheckCircle className="w-3 h-3 mr-1" />
              Entrega garantizada
            </Badge>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 pb-32">
        <h2 className="text-lg font-semibold text-white/80 mb-4">Nuestros Servicios</h2>
        
        <div className="space-y-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setCurrentView(category.id as ViewType)}
              className="w-full relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5
                         hover:border-white/20 transition-all duration-300 text-left group"
            >
              {/* Glow */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 ${category.bgGlow} rounded-full blur-3xl opacity-50 
                              group-hover:opacity-80 transition-opacity`} />
              
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} 
                               flex items-center justify-center shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  <p className="text-white/60 text-sm">{category.subtitle}</p>
                  <p className="text-white/40 text-xs mt-1">{category.items}</p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h3 className="font-semibold text-white">Compra segura en Conektao</h3>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Tu pedido es procesado directamente por Envagas. Solo compartimos la información 
            necesaria para la entrega.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Datos protegidos
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Seguimiento en tiempo real
            </span>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full border-white/20 text-white/80 hover:bg-white/10"
          >
            <Phone className="w-4 h-4 mr-2" />
            Contactar directamente
          </Button>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Button
            onClick={handleSubmitOrder}
            className="h-14 px-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 
                       text-white font-semibold shadow-lg shadow-orange-500/30 flex items-center gap-3"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{hasQuotes ? 'Enviar solicitudes' : 'Finalizar pedido'} ({cart.length})</span>
            {!hasQuotes && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cartTotal)}
              </span>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default EnvagasMarketplace;
