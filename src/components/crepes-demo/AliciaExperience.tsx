import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, RotateCcw, Sparkles, TrendingUp, Clock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const traditionalConversation: Message[] = [
  { id: '1', role: 'assistant', content: 'Bienvenido a Crepes & Waffles. Seleccione una opción:\n1. Ver menú\n2. Hacer pedido\n3. Estado de pedido\n4. Hablar con asesor', timestamp: new Date() },
  { id: '2', role: 'user', content: '2', timestamp: new Date() },
  { id: '3', role: 'assistant', content: 'Seleccione categoría:\n1. Crepes salados\n2. Crepes dulces\n3. Waffles\n4. Helados\n5. Bebidas', timestamp: new Date() },
  { id: '4', role: 'user', content: '1', timestamp: new Date() },
  { id: '5', role: 'assistant', content: 'Crepes salados disponibles:\n1. Crepe de pollo - $28.900\n2. Crepe de champiñones - $26.900\n3. Crepe de carne - $32.900\n4. Crepe de jamón y queso - $24.900', timestamp: new Date() },
  { id: '6', role: 'user', content: '1', timestamp: new Date() },
  { id: '7', role: 'assistant', content: 'Ha seleccionado Crepe de pollo. ¿Desea agregarlo al carrito?\n1. Sí\n2. No', timestamp: new Date() },
];

const aliciaConversation: Message[] = [
  { id: '1', role: 'assistant', content: '¡Hola! 👋 Soy ALICIA, tu asistente de Crepes & Waffles. Veo que nos escribes desde la zona norte de Bogotá. ¿Qué se te antoja hoy? 🥞', timestamp: new Date() },
  { id: '2', role: 'user', content: 'Hola! Quiero pedir algo rico para almorzar', timestamp: new Date() },
  { id: '3', role: 'assistant', content: '¡Perfecto para el almuerzo! 🌟 \n\nBasándome en lo más pedido a esta hora, te recomiendo nuestro **Crepe de Pollo** con ensalada de la casa. Es el favorito del mediodía.\n\n¿Te gustaría ese, o prefieres que te cuente otras opciones?', timestamp: new Date() },
  { id: '4', role: 'user', content: 'Suena bien! Pero algo de tomar también', timestamp: new Date() },
  { id: '5', role: 'assistant', content: '¡Excelente elección! 😊\n\nPara acompañar tu crepe, te sugiero nuestra **Limonada de Coco** bien fría, es la combinación perfecta.\n\n📝 Tu pedido:\n• Crepe de Pollo - $28.900\n• Limonada de Coco - $12.900\n\n**Total: $41.800**\n\n¿Lo confirmo para entrega en tu ubicación? 🛵', timestamp: new Date() },
  { id: '6', role: 'user', content: 'Sí, perfecto!', timestamp: new Date() },
  { id: '7', role: 'assistant', content: '¡Listo! ✅ Tu pedido está confirmado.\n\n🕐 **Tiempo estimado:** 25-30 min\n📍 **Dirección:** Cra 15 #93-75 (la que tienes guardada)\n💳 **Pago:** Al recibir o en línea\n\n¿Deseas pagar ahora con tu tarjeta guardada? Te ahorra tiempo en la entrega 😉', timestamp: new Date() },
];

const AliciaExperience = () => {
  const [traditionalMessages, setTraditionalMessages] = useState<Message[]>([]);
  const [aliciaMessages, setAliciaMessages] = useState<Message[]>([]);
  const [showImpact, setShowImpact] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const traditionalRef = useRef<HTMLDivElement>(null);
  const aliciaRef = useRef<HTMLDivElement>(null);

  const startDemo = () => {
    setTraditionalMessages([]);
    setAliciaMessages([]);
    setShowImpact(false);
    setIsPlaying(true);

    // Animate traditional chat
    traditionalConversation.forEach((msg, index) => {
      setTimeout(() => {
        setTraditionalMessages(prev => [...prev, msg]);
        if (traditionalRef.current) {
          traditionalRef.current.scrollTop = traditionalRef.current.scrollHeight;
        }
      }, index * 1500);
    });

    // Animate ALICIA chat (faster, more natural)
    aliciaConversation.forEach((msg, index) => {
      setTimeout(() => {
        setAliciaMessages(prev => [...prev, msg]);
        if (aliciaRef.current) {
          aliciaRef.current.scrollTop = aliciaRef.current.scrollHeight;
        }
        
        if (index === aliciaConversation.length - 1) {
          setTimeout(() => {
            setShowImpact(true);
            setIsPlaying(false);
          }, 1000);
        }
      }, index * 1200);
    });
  };

  useEffect(() => {
    const timer = setTimeout(startDemo, 500);
    return () => clearTimeout(timer);
  }, []);

  const impactMetrics = [
    { icon: TrendingUp, label: 'Conversión chat → pedido', value: '+20%', color: 'text-green-600' },
    { icon: Clock, label: 'Tiempo para cerrar pedido', value: '–35%', color: 'text-blue-600' },
    { icon: ShoppingCart, label: 'Abandono en WhatsApp', value: '–30%', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-[#5C4033] mb-2">
            Experiencia del Cliente
          </h2>
          <p className="text-[#5C4033]/70">
            Compara el chatbot tradicional vs ALICIA en tiempo real
          </p>
        </motion.div>

        {/* Flip container */}
        <div className="relative" style={{ perspective: '2000px' }}>
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front - Chat comparison */}
            <div style={{ backfaceVisibility: 'hidden' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Traditional Chatbot */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="bg-gray-300 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Bot Tradicional</h3>
                      <p className="text-xs text-gray-500">Flujo rígido por menús</p>
                    </div>
                  </div>
                  
                  <div 
                    ref={traditionalRef}
                    className="h-[400px] overflow-y-auto p-4 space-y-3"
                  >
                    <AnimatePresence>
                      {traditionalMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            max-w-[80%] p-3 rounded-lg whitespace-pre-line text-sm
                            ${msg.role === 'user' 
                              ? 'bg-gray-400 text-white' 
                              : 'bg-white text-gray-700 border border-gray-200'}
                          `}>
                            {msg.content}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  <div className="bg-gray-200 p-4">
                    <div className="flex gap-2">
                      <input 
                        disabled
                        placeholder="Escriba un número..."
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-300 text-gray-500 text-sm"
                      />
                      <Button disabled variant="secondary" size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* ALICIA Chatbot */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-[#FF6B35]/20"
                >
                  <div className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        ALICIA
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">IA</span>
                      </h3>
                      <p className="text-xs text-white/80">Conversacional · Empática · Inteligente</p>
                    </div>
                  </div>
                  
                  <div 
                    ref={aliciaRef}
                    className="h-[400px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FFF9F5] to-white"
                  >
                    <AnimatePresence>
                      {aliciaMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            max-w-[85%] p-3 rounded-2xl text-sm
                            ${msg.role === 'user' 
                              ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white rounded-br-sm' 
                              : 'bg-white text-[#5C4033] shadow-sm border border-[#5C4033]/10 rounded-bl-sm'}
                          `}>
                            <div className="whitespace-pre-line">{msg.content}</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  <div className="bg-white border-t border-[#5C4033]/10 p-4">
                    <div className="flex gap-2">
                      <input 
                        disabled
                        placeholder="Escribe naturalmente..."
                        className="flex-1 px-4 py-2 rounded-full bg-[#F5F0E8] text-[#5C4033] text-sm border border-[#5C4033]/10"
                      />
                      <Button 
                        disabled 
                        className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E]"
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Impact Metrics */}
        <AnimatePresence>
          {showImpact && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#5C4033]/10">
                <h3 className="text-center text-lg font-semibold text-[#5C4033] mb-6">
                  Impacto Medido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {impactMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.15 }}
                      className="text-center p-4 rounded-xl bg-[#F5F0E8]"
                    >
                      <metric.icon className={`w-8 h-8 mx-auto mb-2 ${metric.color}`} />
                      <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                      <p className="text-sm text-[#5C4033]/70 mt-1">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={startDemo}
                  variant="outline"
                  className="border-[#5C4033]/20 text-[#5C4033]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir Demo
                </Button>
                <Button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="bg-gradient-to-r from-[#FF6B35] to-[#2DD4BF] text-white"
                >
                  Ver Flujo Backend →
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replay button while playing */}
        {isPlaying && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 text-[#5C4033]/50">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-[#FF6B35]"
              />
              <span className="text-sm">Simulación en curso...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AliciaExperience;
