import React from 'react';

interface AIGlowBorderProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
}

const AIGlowBorder: React.FC<AIGlowBorderProps> = ({ children, className = '', borderRadius = 'rounded-2xl' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Static gradient border */}
      <div
        className={`absolute -inset-[1px] ${borderRadius}`}
        style={{
          background: 'linear-gradient(135deg, #00D4AA, #FF6B35, #00D4AA)',
        }}
      />
      {/* Subtle glow */}
      <div
        className={`absolute -inset-[1px] ${borderRadius} blur-sm opacity-20`}
        style={{
          background: 'linear-gradient(135deg, #00D4AA, #FF6B35)',
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
