import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Building2, Sparkles } from 'lucide-react';
import aliciaImage from '@/assets/alicia-avatar.png';
interface DemoCommandCenterProps {
  onNavigate: (view: 'alicia' | 'branch-manager' | 'regional-manager' | 'general-manager' | 'backstage') => void;
}
const DemoCommandCenter: React.FC<DemoCommandCenterProps> = ({
  onNavigate
}) => {
  const cards = [{
    id: 'branch-manager',
    title: 'Gerente de Sucursal',
    subtitle: 'Visión Operativa',
    description: 'Control en tiempo real',
    icon: User,
    gradient: 'from-[#5C4033] to-[#8B7355]',
    delay: 0.2
  }, {
    id: 'regional-manager',
    title: 'Gerente Regional',
    subtitle: 'Comparativos',
    description: 'Análisis multi-sucursal',
    icon: Users,
    gradient: 'from-[#6B5344] to-[#9B8375]',
    delay: 0.25
  }, {
    id: 'general-manager',
    title: 'Gerente General',
    subtitle: 'Visión Global',
    description: 'Decisiones estratégicas',
    icon: Building2,
    gradient: 'from-[#4A3525] to-[#6B5344]',
    delay: 0.3
  }];
  return <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: -30
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          
          <span className="text-xl font-semibold text-[#5C4033]">Conektao</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#5C4033] mb-3">
          Centro de Control Inteligente
        </h1>
        <p className="text-[#5C4033]/70 text-lg max-w-2xl mx-auto">
          Experimenta cómo la IA conversacional transforma cada nivel de tu operación
        </p>
      </motion.div>

      {/* ALICIA Featured Card */}
      <motion.div initial={{
      opacity: 0,
      y: 30,
      scale: 0.95
    }} animate={{
      opacity: 1,
      y: 0,
      scale: 1
    }} transition={{
      delay: 0.1,
      duration: 0.5
    }} whileHover={{
      scale: 1.01
    }} whileTap={{
      scale: 0.99
    }} onClick={() => onNavigate('alicia')} className="relative cursor-pointer mb-8 max-w-4xl w-full group" style={{
      background: 'transparent'
    }}>
        {/* Outer glow diffuse effect */}
        <motion.div className="absolute -inset-8 rounded-[60px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.08) 0%, rgba(45,212,191,0.05) 40%, transparent 70%)',
        filter: 'blur(40px)'
      }} animate={{
        opacity: [0.4, 0.7, 0.4],
        scale: [0.95, 1.02, 0.95]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut'
      }} />

        {/* Inner glass container */}
        <div className="relative rounded-[40px] overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(245,239,230,0.03) 0%, rgba(92,64,51,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 80px rgba(255,107,53,0.06), 0 0 120px rgba(45,212,191,0.04), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}>
          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{
          border: '1px solid rgba(255,255,255,0.03)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%)'
        }} />

          {/* Animated energy flows */}
          <motion.div className="absolute top-0 left-1/4 w-1/2 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,107,53,0.3), rgba(45,212,191,0.3), transparent)'
        }} animate={{
          opacity: [0, 0.6, 0],
          scaleX: [0.5, 1, 0.5]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }} />

          <motion.div className="absolute bottom-0 right-1/4 w-1/2 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.2), rgba(255,107,53,0.2), transparent)'
        }} animate={{
          opacity: [0, 0.4, 0],
          scaleX: [0.5, 1, 0.5]
        }} transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }} />

          {/* Floating ambient orbs */}
          <motion.div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)'
        }} animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
          opacity: [0.3, 0.6, 0.3]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }} />
          
          <motion.div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 60%)',
          filter: 'blur(50px)'
        }} animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
          opacity: [0.2, 0.5, 0.2]
        }} transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1
        }} />

          {/* Center pulse effect */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(255,107,53,0.03) 0%, transparent 50%)'
        }} animate={{
          opacity: [0.3, 0.6, 0.3]
        }} transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut'
        }} />

        {/* Content */}
        <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
          {/* Avatar with micro-animations */}
          <motion.div className="relative flex-shrink-0" animate={{
            y: [0, -4, 0]
          }} transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}>
            {/* Subtle glow behind avatar */}
            <motion.div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(92,64,51,0.15) 0%, transparent 60%)',
              filter: 'blur(15px)'
            }} animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }} />
            
            <motion.img src={aliciaImage} alt="ALICIA" className="w-32 h-32 md:w-44 md:h-44 object-cover object-top rounded-2xl relative z-10" style={{
              filter: 'drop-shadow(0 8px 25px rgba(92,64,51,0.2))'
            }} animate={{
              scale: [1, 1.01, 1]
            }} transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }} />

            {/* Floating particles */}
            {[...Array(3)].map((_, i) => <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#FF6B35]/40 to-[#2DD4BF]/40" style={{
              top: `${20 + i * 25}%`,
              right: `${-5 + i * 10}%`
            }} animate={{
              y: [-5, 5, -5],
              opacity: [0.3, 0.7, 0.3]
            }} transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5
            }} />)}
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
            
            <motion.div className="relative inline-flex items-center justify-center md:justify-start gap-3 mt-5 px-6 py-3 rounded-full cursor-pointer overflow-hidden group" style={{
              background: 'linear-gradient(135deg, rgba(92,64,51,0.9) 0%, rgba(139,107,79,0.85) 50%, rgba(92,64,51,0.9) 100%)',
              boxShadow: '0 4px 30px rgba(92,64,51,0.3), 0 0 40px rgba(139,107,79,0.15)'
            }} whileHover={{
              scale: 1.03
            }} whileTap={{
              scale: 0.98
            }}>
              {/* Light wave effect 1 */}
              <motion.div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)'
              }} animate={{
                x: ['-100%', '200%']
              }} transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 1
              }} />
              
              {/* Light wave effect 2 */}
              <motion.div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
              }} animate={{
                x: ['-100%', '200%']
              }} transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
                repeatDelay: 1.5
              }} />

              {/* Subtle glow pulse */}
              <motion.div className="absolute inset-0 rounded-full pointer-events-none" style={{
                boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
              }} animate={{
                opacity: [0.3, 0.6, 0.3]
              }} transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }} />

              <span className="relative z-10 text-white/95 font-semibold tracking-wide">
                Vivir la experiencia
              </span>
              <motion.span className="relative z-10 text-white/80" animate={{
                x: [0, 4, 0]
              }} transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}>
                →
              </motion.span>
            </motion.div>
          </div>

          {/* Decorative badge */}
          <div className="hidden lg:flex flex-col items-center gap-2 px-6 py-4 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span className="text-3xl font-bold text-[#FF6B35]">+15%</span>
            <span className="text-xs text-[#5C4033]/70 text-center">Ticket Promedio 
Domicilios<br />en pedidos</span>
          </div>
        </div>

        {/* Hover glow effect */}
        <motion.div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.04) 0%, transparent 60%)'
        }} initial={{
          opacity: 0
        }} whileHover={{
          opacity: 1
        }} transition={{
          duration: 0.5
        }} />
        </div>
      </motion.div>

      {/* Role Cards - Compact horizontal layout */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl w-full">
        {cards.map(card => <motion.div key={card.id} initial={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} transition={{
        delay: card.delay,
        duration: 0.4
      }} whileHover={{
        scale: 1.05,
        y: -3
      }} whileTap={{
        scale: 0.97
      }} onClick={() => onNavigate(card.id as any)} className="relative cursor-pointer group">
            {/* Glassmorphic card */}
            <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(92,64,51,0.85) 0%, rgba(139,115,85,0.75) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(92,64,51,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}>
              {/* Subtle hover glow */}
              <motion.div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)'
          }} initial={{
            opacity: 0
          }} whileHover={{
            opacity: 1
          }} transition={{
            duration: 0.3
          }} />

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
                <card.icon className="w-5 h-5 text-white" />
              </div>

              {/* Text content */}
              <div className="flex flex-col min-w-0">
                <h3 className="text-white text-sm font-semibold leading-tight">{card.title}</h3>
                <p className="text-white/60 text-xs">{card.subtitle}</p>
              </div>

              {/* Arrow */}
              <motion.span className="text-white/70 ml-2" animate={{
            x: [0, 4, 0]
          }} transition={{
            repeat: Infinity,
            duration: 1.5
          }}>
                →
              </motion.span>
            </div>
          </motion.div>)}

        {/* Backstage inside ALICIA indicator */}
        
      </div>

      {/* Footer */}
      <motion.p initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.8
    }} className="mt-12 text-[#5C4033]/50 text-sm">
        Demo interactiva · Datos simulados para demostración
      </motion.p>
    </div>;
};
export default DemoCommandCenter;