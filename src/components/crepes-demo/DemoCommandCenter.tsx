import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Building2, Layers } from 'lucide-react';
import aliciaImage from '@/assets/alicia-avatar.png';

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
      delay: 0.2,
    },
    {
      id: 'regional-manager',
      title: 'Gerente Regional',
      subtitle: 'Comparativos',
      description: 'Análisis multi-sucursal y alertas inteligentes',
      icon: Users,
      gradient: 'from-[#2DD4BF] to-[#14B8A6]',
      delay: 0.3,
    },
    {
      id: 'general-manager',
      title: 'Gerente General',
      subtitle: 'Visión Global',
      description: 'Decisiones estratégicas con IA conversacional',
      icon: Building2,
      gradient: 'from-[#5C4033] to-[#3D2817]',
      delay: 0.4,
    },
    {
      id: 'backstage',
      title: 'Flujo Completo',
      subtitle: 'Backstage',
      description: 'Del cliente al reporte, sin fricciones',
      icon: Layers,
      gradient: 'from-[#6366F1] to-[#8B5CF6]',
      delay: 0.5,
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

      {/* ALICIA Featured Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('alicia')}
        className="relative cursor-pointer rounded-3xl overflow-hidden mb-8 max-w-4xl w-full"
      >
        {/* Background with warm gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD3] to-[#D4C4B5]" />
        
        {/* Animated glow orbs */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
          {/* Avatar with micro-animations */}
          <motion.div
            className="relative flex-shrink-0"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Subtle glow behind avatar */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(92,64,51,0.15) 0%, transparent 60%)',
                filter: 'blur(15px)',
              }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            <motion.img
              src={aliciaImage}
              alt="ALICIA"
              className="w-32 h-32 md:w-44 md:h-44 object-cover object-top rounded-2xl relative z-10"
              style={{
                filter: 'drop-shadow(0 8px 25px rgba(92,64,51,0.2))',
              }}
              animate={{
                scale: [1, 1.01, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Floating particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#FF6B35]/40 to-[#2DD4BF]/40"
                style={{
                  top: `${20 + i * 25}%`,
                  right: `${-5 + i * 10}%`,
                }}
                animate={{
                  y: [-5, 5, -5],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              />
            ))}
          </motion.div>

          {/* Text content */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h3 className="text-2xl md:text-3xl font-bold text-[#5C4033]">ALICIA</h3>
              <span className="px-3 py-1 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white text-xs font-medium rounded-full">
                IA Conversacional
              </span>
            </div>
            <p className="text-[#5C4033]/80 text-base md:text-lg font-medium mb-2">
              Experiencia del Cliente
            </p>
            <p className="text-[#5C4033]/60 text-sm md:text-base max-w-md">
              Transforma pedidos en experiencias memorables con empatía, velocidad y contexto inteligente
            </p>
            
            <motion.div 
              className="flex items-center justify-center md:justify-start gap-2 mt-4 text-[#FF6B35] font-medium"
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span>Vivir la experiencia</span>
              <span>→</span>
            </motion.div>
          </div>

          {/* Decorative badge */}
          <div className="hidden lg:flex flex-col items-center gap-2 px-6 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#5C4033]/10">
            <span className="text-3xl font-bold text-[#FF6B35]">+20%</span>
            <span className="text-xs text-[#5C4033]/70 text-center">Conversión<br/>en pedidos</span>
          </div>
        </div>

        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/5 to-[#2DD4BF]/5 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Other Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
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
            <div className="relative p-6 min-h-[180px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-white text-lg font-bold mb-1">{card.title}</h3>
                <p className="text-white/80 text-xs font-medium mb-1">{card.subtitle}</p>
                <p className="text-white/70 text-xs">{card.description}</p>
              </div>

              <div className="flex items-center gap-2 mt-3 text-white/80 text-xs">
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
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
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
