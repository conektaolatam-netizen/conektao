import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bot, ShoppingCart, ChefHat, Truck, 
  MessageSquare, BarChart3, ArrowRight, CheckCircle2
} from 'lucide-react';

const BackstageFlow = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const flowSteps = [
    { 
      id: 'cliente', 
      icon: User, 
      label: 'Cliente', 
      description: 'Inicia conversación',
      detail: 'WhatsApp, Web o App',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'alicia', 
      icon: Bot, 
      label: 'ALICIA', 
      description: 'Procesa pedido',
      detail: 'IA Conversacional',
      color: 'from-[#FF6B35] to-[#F7931E]'
    },
    { 
      id: 'pos', 
      icon: ShoppingCart, 
      label: 'POS', 
      description: 'Registra venta',
      detail: 'Sistema integrado',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'cocina', 
      icon: ChefHat, 
      label: 'Cocina', 
      description: 'Prepara pedido',
      detail: 'KDS en tiempo real',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'domicilio', 
      icon: Truck, 
      label: 'Domicilio', 
      description: 'Entrega',
      detail: 'Tracking GPS',
      color: 'from-cyan-500 to-cyan-600'
    },
    { 
      id: 'feedback', 
      icon: MessageSquare, 
      label: 'Feedback', 
      description: 'Calificación',
      detail: 'NPS automático',
      color: 'from-pink-500 to-pink-600'
    },
    { 
      id: 'reportes', 
      icon: BarChart3, 
      label: 'Reportes', 
      description: 'Análisis',
      detail: 'BI en tiempo real',
      color: 'from-[#5C4033] to-[#3D2817]'
    },
  ];

  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= flowSteps.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating, flowSteps.length]);

  return (
    <div className="min-h-screen p-8 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-[#5C4033] mb-2">
            Flujo Operativo Completo
          </h2>
          <p className="text-[#5C4033]/70">
            Del cliente al reporte, sin fricciones
          </p>
        </motion.div>

        {/* Flow visualization */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#5C4033]/10 -translate-y-1/2 hidden lg:block" />
          
          {/* Progress line */}
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#FF6B35] to-[#2DD4BF] -translate-y-1/2 hidden lg:block"
            initial={{ width: '0%' }}
            animate={{ width: `${(activeStep / (flowSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 relative">
            {flowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setActiveStep(index);
                  setIsAnimating(false);
                }}
                className="cursor-pointer"
              >
                <motion.div
                  animate={{
                    scale: activeStep === index ? 1.1 : 1,
                    y: activeStep === index ? -10 : 0,
                  }}
                  className={`
                    relative bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-300
                    ${activeStep === index 
                      ? 'border-[#FF6B35] shadow-lg' 
                      : activeStep > index 
                        ? 'border-green-400' 
                        : 'border-[#5C4033]/10'}
                  `}
                >
                  {/* Completed check */}
                  {activeStep > index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-xl bg-gradient-to-br ${step.color}
                    flex items-center justify-center mx-auto mb-3
                    ${activeStep === index ? 'animate-pulse' : ''}
                  `}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Labels */}
                  <h4 className="font-semibold text-[#5C4033] text-center text-sm">{step.label}</h4>
                  <p className="text-xs text-[#5C4033]/60 text-center mt-1">{step.description}</p>
                  
                  {/* Detail badge */}
                  <AnimatePresence>
                    {activeStep === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 px-2 py-1 bg-[#FF6B35]/10 rounded-full"
                      >
                        <p className="text-xs text-[#FF6B35] text-center font-medium">{step.detail}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-[#5C4033]/10"
        >
          <div className="flex items-start gap-6">
            <div className={`
              w-16 h-16 rounded-2xl bg-gradient-to-br ${flowSteps[activeStep].color}
              flex items-center justify-center flex-shrink-0
            `}>
              {React.createElement(flowSteps[activeStep].icon, { className: 'w-8 h-8 text-white' })}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#5C4033] mb-2">
                {flowSteps[activeStep].label}
              </h3>
              <p className="text-[#5C4033]/70 mb-4">
                {getStepDescription(flowSteps[activeStep].id)}
              </p>
              
              {/* Data flow indicators */}
              <div className="flex flex-wrap gap-2">
                {getStepData(flowSteps[activeStep].id).map((data, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-[#F5F0E8] rounded-full text-sm text-[#5C4033]"
                  >
                    {data}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Play/Pause control */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`
              px-6 py-2 rounded-full text-sm font-medium transition-all
              ${isAnimating 
                ? 'bg-[#5C4033] text-white' 
                : 'bg-[#F5F0E8] text-[#5C4033] border border-[#5C4033]/20'}
            `}
          >
            {isAnimating ? '⏸ Pausar animación' : '▶ Reproducir flujo'}
          </button>
        </div>
      </div>
    </div>
  );
};

const getStepDescription = (stepId: string): string => {
  const descriptions: Record<string, string> = {
    cliente: 'El cliente inicia la conversación desde su canal preferido. ALICIA reconoce su historial y preferencias automáticamente.',
    alicia: 'La IA procesa el lenguaje natural, recomienda productos basándose en contexto, y cierra el pedido en menos de 3 minutos.',
    pos: 'El pedido se registra automáticamente en el sistema de ventas, actualiza inventario y asigna a cocina.',
    cocina: 'El equipo de cocina recibe el pedido en pantalla con priorización inteligente y tiempos estimados.',
    domicilio: 'El repartidor recibe la ruta optimizada. El cliente puede trackear en tiempo real.',
    feedback: 'Post-entrega, ALICIA solicita calificación de forma natural. Datos alimentan mejora continua.',
    reportes: 'Todos los datos fluyen a dashboards en tiempo real para cada nivel gerencial.',
  };
  return descriptions[stepId] || '';
};

const getStepData = (stepId: string): string[] => {
  const data: Record<string, string[]> = {
    cliente: ['Ubicación', 'Historial', 'Preferencias', 'Canal'],
    alicia: ['NLP', 'Recomendaciones', 'Cross-sell', 'Confirmación'],
    pos: ['Venta', 'Inventario', 'Método pago', 'Factura'],
    cocina: ['Prioridad', 'Ingredientes', 'Tiempo', 'Estado'],
    domicilio: ['Ruta', 'GPS', 'ETA', 'Notificaciones'],
    feedback: ['NPS', 'Comentarios', 'Calificación', 'Seguimiento'],
    reportes: ['KPIs', 'Tendencias', 'Alertas', 'Predicciones'],
  };
  return data[stepId] || [];
};

export default BackstageFlow;
