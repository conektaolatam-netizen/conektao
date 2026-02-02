import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Building2, Layers } from 'lucide-react';

interface DemoCommandCenterProps {
  onNavigate: (view: 'alicia' | 'branch-manager' | 'regional-manager' | 'general-manager' | 'backstage') => void;
}

const DemoCommandCenter: React.FC<DemoCommandCenterProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'branch-manager',
      title: 'Gerente de Sucursal',
      subtitle: 'Visión Operativa',
      description: 'Control en tiempo real de tu punto de venta',
      icon: User,
      gradient: 'from-[#5C4033] to-[#8B7355]',
      delay: 0.1,
    },
    {
      id: 'regional-manager',
      title: 'Gerente Regional',
      subtitle: 'Comparativos',
      description: 'Análisis multi-sucursal y alertas inteligentes',
      icon: Users,
      gradient: 'from-[#2DD4BF] to-[#14B8A6]',
      delay: 0.2,
    },
    {
      id: 'general-manager',
      title: 'Gerente General',
      subtitle: 'Visión Global',
      description: 'Decisiones estratégicas con IA conversacional',
      icon: Building2,
      gradient: 'from-[#5C4033] to-[#3D2817]',
      delay: 0.3,
    },
    {
      id: 'backstage',
      title: 'Flujo Completo',
      subtitle: 'Backstage',
      description: 'Del cliente al reporte, sin fricciones',
      icon: Layers,
      gradient: 'from-[#6366F1] to-[#8B5CF6]',
      delay: 0.4,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Crepes_%26_Waffles_logo.svg/2560px-Crepes_%26_Waffles_logo.svg.png" 
            alt="Crepes & Waffles" 
            className="h-12 object-contain"
          />
          <span className="text-[#5C4033]/30 text-3xl font-light">×</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#2DD4BF] flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-semibold text-[#5C4033]">Conektao</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#5C4033] mb-3">
          Centro de Control Inteligente
        </h1>
        <p className="text-[#5C4033]/70 text-lg max-w-2xl mx-auto">
          Experimenta cómo la IA conversacional transforma cada nivel de tu operación
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(card.id as any)}
            className="relative cursor-pointer rounded-2xl overflow-hidden"
          >
            {/* Card background */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90
            `} />
            
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Content */}
            <div className="relative p-8 min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-1">{card.title}</h3>
                <p className="text-white/80 text-sm font-medium mb-2">{card.subtitle}</p>
                <p className="text-white/70 text-sm">{card.description}</p>
              </div>

              <div className="flex items-center gap-2 mt-4 text-white/80 text-sm">
                <span>Explorar</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -top-5 -left-5 w-20 h-20 rounded-full bg-white/5" />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-[#5C4033]/50 text-sm"
      >
        Demo interactiva · Datos simulados para demostración
      </motion.p>
    </div>
  );
};

export default DemoCommandCenter;
