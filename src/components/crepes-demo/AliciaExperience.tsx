import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, RotateCcw, Sparkles, TrendingUp, Clock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AliciaAvatar from './AliciaAvatar';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const aliciaConversation: Message[] = [{
  id: '1',
  role: 'assistant',
  content: '¡Hola! 👋 Soy ALICIA, tu asistente de Crepes & Waffles. Veo que nos escribes desde la zona norte de Bogotá. ¿Qué se te antoja hoy? 🥞',
  timestamp: new Date()
}, {
  id: '2',
  role: 'user',
  content: 'Hola! Quiero pedir algo rico para almorzar',
  timestamp: new Date()
}, {
  id: '3',
  role: 'assistant',
  content: '¡Perfecto para el almuerzo! 🌟 \n\nBasándome en lo más pedido a esta hora, te recomiendo nuestro Crepe de Pollo con ensalada de la casa. Es el favorito del mediodía.\n\n¿Te gustaría ese, o prefieres que te cuente otras opciones?',
  timestamp: new Date()
}, {
  id: '4',
  role: 'user',
  content: 'Suena bien! Pero algo de tomar también',
  timestamp: new Date()
}, {
  id: '5',
  role: 'assistant',
  content: '¡Excelente elección! 😊\n\nPara acompañar tu crepe, te sugiero nuestra Limonada de Coco bien fría, es la combinación perfecta.\n\n📝 Tu pedido:\n• Crepe de Pollo - $28.900\n• Limonada de Coco - $12.900\n\nTotal: $41.800\n\n¿Lo confirmo para entrega en tu ubicación? 🛵',
  timestamp: new Date()
}, {
  id: '6',
  role: 'user',
  content: 'Sí, perfecto!',
  timestamp: new Date()
}, {
  id: '7',
  role: 'assistant',
  content: '¡Listo! ✅ Tu pedido está confirmado.\n\n🕐 Tiempo estimado: 25-30 min\n📍 Dirección: Cra 15 #93-75 (la que tienes guardada)\n💳 Pago: Al recibir o en línea\n\n¿Deseas pagar ahora con tu tarjeta guardada? Te ahorra tiempo en la entrega 😉',
  timestamp: new Date()
}];
const AliciaExperience = () => {
  const [aliciaMessages, setAliciaMessages] = useState<Message[]>([]);
  const [showImpact, setShowImpact] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const aliciaRef = useRef<HTMLDivElement>(null);
  const startDemo = () => {
    setAliciaMessages([]);
    setShowImpact(false);
    setIsPlaying(true);
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
  const impactMetrics = [{
    icon: TrendingUp,
    label: 'Conversión chat → pedido',
    value: '+20%',
    color: 'text-green-600'
  }, {
    icon: Clock,
    label: 'Tiempo para cerrar pedido',
    value: '–35%',
    color: 'text-blue-600'
  }, {
    icon: ShoppingCart,
    label: 'Abandono en WhatsApp',
    value: '–30%',
    color: 'text-purple-600'
  }];
  return <div className="min-h-screen p-4 md:p-8 pt-20 bg-gradient-to-br from-[#3D2914] via-[#5C4033] to-[#4A3525] relative overflow-hidden">
      {/* Animated light waves background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(139,107,79,0.3) 0%, transparent 60%)',
          }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-full h-full"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 80% 70%, rgba(184,134,91,0.25) 0%, transparent 50%)',
          }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(139,107,79,0.1) 90deg, transparent 180deg, rgba(184,134,91,0.08) 270deg, transparent 360deg)',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with ALICIA Avatar */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#F5E6D3] via-[#D4B896] to-[#F5E6D3] bg-clip-text text-transparent mb-2">
            Experiencia del Cliente
          </h2>
          <p className="text-[#D4B896]/80">
            Compara el chatbot tradicional vs ALICIA en tiempo real
          </p>
        </motion.div>

        {/* Main content grid - ALICIA only */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          
          {/* ALICIA Avatar Center Piece */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="hidden lg:block">
            <AliciaAvatar className="h-full min-h-[500px] rounded-3xl" />
          </motion.div>

          {/* ALICIA Chatbot */}
          <motion.div initial={{
          opacity: 0,
          x: 30
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.3
        }} className="rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Glassmorphic border glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-[#D4B896]/50 via-[#8B6B4F]/30 to-[#D4B896]/50 rounded-2xl blur-sm" />
            <div className="relative bg-gradient-to-br from-[#FAF6F1] via-[#FFF9F5] to-[#F5EDE4] rounded-2xl overflow-hidden">
              {/* Header with premium gradient */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#5C4033] via-[#7A5C45] to-[#5C4033]" />
                {/* Light wave effect on header */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(212,184,150,0.15) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative p-4 flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4B896]/30 to-[#8B6B4F]/20 backdrop-blur-sm flex items-center justify-center border border-[#D4B896]/30"
                    animate={{ 
                      boxShadow: ['0 0 15px rgba(212,184,150,0.3)', '0 0 25px rgba(212,184,150,0.5)', '0 0 15px rgba(212,184,150,0.3)']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-[#D4B896]" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-[#F5E6D3] flex items-center gap-2">
                      ALICIA
                      <span className="px-2 py-0.5 bg-gradient-to-r from-[#D4B896]/20 to-[#8B6B4F]/20 backdrop-blur-sm rounded-full text-xs text-[#D4B896] border border-[#D4B896]/30">IA</span>
                    </h3>
                    <p className="text-xs text-[#D4B896]/80">Conversacional · Empática · Inteligente</p>
                  </div>
                </div>
              </div>
              
              {/* Chat area with cream/light background */}
              <div ref={aliciaRef} className="h-[350px] md:h-[400px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FFF9F5] via-[#FFFCF8] to-[#FAF6F1]">
                <AnimatePresence>
                  {aliciaMessages.map(msg => <motion.div key={msg.id} initial={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95
                }} animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[85%] p-3 rounded-2xl text-sm shadow-md
                        ${msg.role === 'user' 
                          ? 'bg-gradient-to-br from-[#5C4033] to-[#7A5C45] text-[#F5E6D3] rounded-br-sm' 
                          : 'bg-white/90 backdrop-blur-sm text-[#5C4033] border border-[#D4B896]/20 rounded-bl-sm'}
                      `}>
                        <div className="whitespace-pre-line">{msg.content}</div>
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </div>
              
              {/* Input area */}
              <div className="bg-gradient-to-r from-[#FAF6F1] to-[#FFF9F5] border-t border-[#D4B896]/20 p-3">
                <div className="flex gap-2">
                  <input disabled placeholder="Escribe naturalmente..." className="flex-1 px-4 py-2 rounded-full bg-white/80 text-[#5C4033] text-sm border border-[#D4B896]/30 placeholder:text-[#8B6B4F]/50" />
                  <Button disabled className="rounded-full bg-gradient-to-r from-[#5C4033] to-[#7A5C45] text-[#F5E6D3] shadow-lg" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile ALICIA Avatar (shown below chat on smaller screens) */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }} className="lg:hidden mt-6">
          <AliciaAvatar className="h-[400px] rounded-3xl" />
        </motion.div>

        {/* Impact Metrics */}
        <AnimatePresence>
          {showImpact && <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: 30
        }} className="mt-8">
              <div className="relative rounded-2xl p-6 shadow-xl overflow-hidden">
                {/* Glassmorphic background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4A3525]/80 via-[#3D2914]/90 to-[#4A3525]/80 backdrop-blur-xl" />
                <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-[#5C4033]/60 to-[#3D2914]/80" />
                <div className="absolute inset-0 border border-[#D4B896]/20 rounded-2xl" />
                
                <div className="relative z-10">
                  <h3 className="text-center text-lg font-semibold bg-gradient-to-r from-[#F5E6D3] to-[#D4B896] bg-clip-text text-transparent mb-6">
                    Impacto Medido
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {impactMetrics.map((metric, index) => <motion.div key={metric.label} initial={{
                  opacity: 0,
                  scale: 0.8
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} transition={{
                  delay: index * 0.15
                }} className="text-center p-4 rounded-xl bg-gradient-to-br from-[#5C4033]/40 to-[#3D2914]/60 border border-[#D4B896]/20 backdrop-blur-sm">
                        <metric.icon className="w-8 h-8 mx-auto mb-2 text-[#D4B896]" />
                        <p className="text-3xl font-bold text-[#F5E6D3]">{metric.value}</p>
                        <p className="text-sm text-[#D4B896]/80 mt-1">{metric.label}</p>
                      </motion.div>)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Button onClick={startDemo} variant="outline" className="border-[#D4B896]/30 text-[#F5E6D3] bg-[#5C4033]/30 hover:bg-[#5C4033]/50 backdrop-blur-sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir Demo
                </Button>
                <Button onClick={() => setIsFlipped(!isFlipped)} className="bg-gradient-to-r from-[#5C4033] to-[#8B6B4F] text-[#F5E6D3] shadow-lg hover:shadow-[#D4B896]/20">
                  Ver Flujo Backend →
                </Button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Replay indicator while playing */}
        {isPlaying && <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 text-[#D4B896]/70">
              <motion.div animate={{
            scale: [1, 1.2, 1],
            boxShadow: ['0 0 5px rgba(212,184,150,0.3)', '0 0 15px rgba(212,184,150,0.6)', '0 0 5px rgba(212,184,150,0.3)']
          }} transition={{
            repeat: Infinity,
            duration: 1
          }} className="w-2 h-2 rounded-full bg-[#D4B896]" />
              <span className="text-sm">Simulación en curso...</span>
            </div>
          </div>}
      </div>
    </div>;
};
export default AliciaExperience;