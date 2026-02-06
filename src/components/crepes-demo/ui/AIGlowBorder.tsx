import React from 'react';
import { motion } from 'framer-motion';

interface AIGlowBorderProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
}

const AIGlowBorder: React.FC<AIGlowBorderProps> = ({ children, className = '', borderRadius = 'rounded-2xl' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Animated gradient border */}
      <motion.div
        className={`absolute -inset-[1px] ${borderRadius} overflow-hidden`}
        style={{
          background: 'conic-gradient(from 0deg, #00D4AA, #FF6B35, #00D4AA)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Glow effect */}
      <div
        className={`absolute -inset-[1px] ${borderRadius} blur-md opacity-30`}
        style={{
          background: 'conic-gradient(from 0deg, #00D4AA, #FF6B35, #00D4AA)',
        }}
      />
      {/* Inner content */}
      <div className={`relative ${borderRadius} overflow-hidden`}>
        {children}
      </div>
    </div>
  );
};

export default AIGlowBorder;
