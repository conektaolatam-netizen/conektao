import React from 'react';
import { motion } from 'framer-motion';
import aliciaImage from '@/assets/alicia-avatar.png';

const AliciaAvatar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Organic background with warm gradients */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {/* Base gradient - warm browns and beige */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD3] to-[#D4C4B5]" />
        
        {/* Soft organic light shapes */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(92,64,51,0.08) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,115,85,0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Subtle AI particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#5C4033]/20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Avatar container with micro-animations */}
      <motion.div
        className="relative z-10 flex items-center justify-center h-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Subtle glow behind avatar */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div 
            className="w-[90%] h-[90%] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(92,64,51,0.1) 0%, transparent 60%)',
              filter: 'blur(20px)',
            }}
          />
        </motion.div>

        {/* Avatar with breathing animation */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -3, 0],
            scale: [1, 1.005, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Main avatar image */}
          <motion.img
            src={aliciaImage}
            alt="ALICIA - Asistente Virtual"
            className="w-auto h-[500px] max-w-full object-contain relative z-10"
            style={{
              filter: 'drop-shadow(0 10px 40px rgba(92,64,51,0.15))',
            }}
          />

          {/* Soft edge glow indicating AI */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 40%, rgba(255,107,53,0.05) 100%)',
              borderRadius: '50%',
            }}
            animate={{
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Floating light particles around avatar */}
        <motion.div
          className="absolute top-10 right-10 w-2 h-2 rounded-full bg-gradient-to-br from-[#FF6B35]/30 to-[#2DD4BF]/30"
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className="absolute bottom-20 left-10 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#5C4033]/20 to-[#8B7355]/20"
          animate={{
            y: [10, -10, 10],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </motion.div>
    </div>
  );
};

export default AliciaAvatar;
