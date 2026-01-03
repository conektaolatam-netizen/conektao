import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Flame, Clock, Truck, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CartItem {
  id: string;
  name: string;
  type: 'product' | 'service' | 'quote';
  price: number;
  quantity: number;
  details?: any;
}

interface Props {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
}

const ResidentialProducts = ({ onAddToCart, onBack }: Props) => {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [selectedCondition, setSelectedCondition] = useState<{ [key: string]: string }>({});

  const products = [
    {
      id: 'glp-20',
      name: 'Cilindro GLP 20 lb',
      capacity: '20 libras (9 kg)',
      price: 55000,
      deliveryTime: '2-4 horas',
      description: 'Ideal para hogares pequeños y uso doméstico básico.',
      popular: true,
      icon: '🏠'
    },
    {
      id: 'glp-30',
      name: 'Cilindro GLP 30 lb',
      capacity: '30 libras (13.6 kg)',
      price: 75000,
      deliveryTime: '2-4 horas',
      description: 'Perfecto para familias medianas con uso regular.',
      popular: false,
      icon: '🏡'
    },
    {
      id: 'glp-40',
      name: 'Cilindro GLP 40 lb',
      capacity: '40 libras (18 kg)',
      price: 95000,
      deliveryTime: '2-4 horas',
      description: 'Alta capacidad para familias grandes o uso intensivo.',
      popular: false,
      icon: '🏘️'
    },
    {
      id: 'glp-100',
      name: 'Cilindro GLP 100 lb',
      capacity: '100 libras (45 kg)',
      price: 230000,
      deliveryTime: '24-48 horas',
      description: 'Uso industrial ligero o negocios pequeños.',
      popular: false,
      icon: '🏢'
    }
  ];

  const conditions = [
    { id: 'exchange', label: 'Intercambio', description: 'Traes tu cilindro vacío' },
    { id: 'refill', label: 'Recarga', description: 'Llenamos tu cilindro' },
    { id: 'new', label: 'Nuevo', description: '+$45.000 por cilindro nuevo' }
  ];

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const getCondition = (productId: string) => selectedCondition[productId] || 'exchange';

  const calculatePrice = (productId: string, basePrice: number) => {
    const condition = getCondition(productId);
    if (condition === 'new') return basePrice + 45000;
    return basePrice;
  };

  const handleAddToCart = (product: typeof products[0]) => {
    const quantity = quantities[product.id] || 1;
    const condition = getCondition(product.id);
    const finalPrice = calculatePrice(product.id, product.price);

    onAddToCart({
      id: `${product.id}-${condition}-${Date.now()}`,
      name: `${product.name} (${conditions.find(c => c.id === condition)?.label})`,
      type: 'product',
      price: finalPrice,
      quantity,
      details: { condition, capacity: product.capacity }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Soluciones Residenciales</h1>
            <p className="text-white/60 text-sm">Cilindros GLP para hogares</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <p className="text-white/90 font-medium text-sm">Entrega el mismo día</p>
              <p className="text-white/60 text-xs mt-1">
                Pedidos antes de las 2pm se entregan hoy. Después, entrega al día siguiente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-6 space-y-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Product Header */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 
                                  flex items-center justify-center text-2xl border border-orange-500/20">
                    {product.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {product.name}
                      {product.popular && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                          Popular
                        </Badge>
                      )}
                    </h3>
                    <p className="text-white/60 text-sm">{product.capacity}</p>
                  </div>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-4">{product.description}</p>

              {/* Delivery Time */}
              <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
                <Clock className="w-4 h-4" />
                <span>Entrega estimada: {product.deliveryTime}</span>
              </div>

              {/* Condition Selector */}
              <div className="mb-4">
                <p className="text-white/60 text-xs mb-2">Condición</p>
                <div className="flex gap-2">
                  {conditions.map(condition => (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(prev => ({ ...prev, [product.id]: condition.id }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                        ${getCondition(product.id) === condition.id
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 border'
                          : 'bg-white/5 border-white/10 text-white/60 border hover:border-white/20'
                        }`}
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
                {getCondition(product.id) === 'new' && (
                  <p className="text-orange-400/80 text-xs mt-2">
                    +$45.000 por cilindro nuevo incluido
                  </p>
                )}
              </div>

              {/* Quantity and Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs">Precio unitario</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(calculatePrice(product.id, product.price))}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="p-2 hover:bg-white/10 rounded-l-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {quantities[product.id] || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="p-2 hover:bg-white/10 rounded-r-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 
                               text-white font-medium px-4"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="px-6 mt-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white/80 mb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            Política de intercambio
          </h4>
          <p className="text-white/50 text-sm">
            Los cilindros de intercambio deben estar en buen estado y pertenecer a marcas 
            autorizadas. Cilindros dañados pueden tener costo adicional de revisión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResidentialProducts;
