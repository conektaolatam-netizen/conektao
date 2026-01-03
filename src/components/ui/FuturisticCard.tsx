import React from 'react';
import { cn } from '@/lib/utils';

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'orange' | 'purple' | 'green' | 'red';
  variant?: 'default' | 'glass' | 'solid';
  isActive?: boolean;
  onClick?: () => void;
}

const glowColors = {
  cyan: {
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    bg: 'from-cyan-500/5 to-cyan-600/10',
    dot: 'bg-cyan-400',
    activeBg: 'from-cyan-500/10 to-cyan-600/20',
  },
  orange: {
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
    bg: 'from-orange-500/5 to-orange-600/10',
    dot: 'bg-orange-400',
    activeBg: 'from-orange-500/10 to-orange-600/20',
  },
  purple: {
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    bg: 'from-purple-500/5 to-purple-600/10',
    dot: 'bg-purple-400',
    activeBg: 'from-purple-500/10 to-purple-600/20',
  },
  green: {
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
    bg: 'from-green-500/5 to-green-600/10',
    dot: 'bg-green-400',
    activeBg: 'from-green-500/10 to-green-600/20',
  },
  red: {
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
    bg: 'from-red-500/5 to-red-600/10',
    dot: 'bg-red-400',
    activeBg: 'from-red-500/10 to-red-600/20',
  },
};

export const FuturisticCard: React.FC<FuturisticCardProps> = ({
  children,
  className,
  glowColor = 'cyan',
  variant = 'default',
  isActive = false,
  onClick,
}) => {
  const colors = glowColors[glowColor];
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-300',
        variant === 'glass' && 'bg-background/40 backdrop-blur-xl',
        variant === 'solid' && 'bg-card',
        variant === 'default' && `bg-gradient-to-br ${isActive ? colors.activeBg : colors.bg}`,
        colors.border,
        'border',
        `shadow-lg ${colors.glow}`,
        onClick && 'cursor-pointer hover:scale-[1.02]',
        isActive && 'ring-1 ring-current',
        className
      )}
    >
      {/* Corner activity indicators */}
      <div className={cn(
        'absolute top-2 right-2 w-2 h-2 rounded-full',
        colors.dot,
        isActive && 'animate-pulse'
      )} />
      <div className={cn(
        'absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full opacity-50',
        colors.dot
      )} />
      
      {/* Glowing border effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={cn(
          'absolute inset-0 rounded-xl',
          `shadow-[inset_0_0_20px_rgba(0,0,0,0)] hover:shadow-[inset_0_0_20px_${colors.glow}]`
        )} />
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div 
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            animation: 'scanline 3s linear infinite',
            top: '0%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// AI Card Component - styled like the reference image
interface AICardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isEnabled?: boolean;
  isPremium?: boolean;
  onToggle?: () => void;
}

export const AICard: React.FC<AICardProps> = ({
  title,
  description,
  icon,
  isEnabled = true,
  isPremium = false,
  onToggle,
}) => {
  return (
    <FuturisticCard 
      glowColor={isEnabled ? 'cyan' : 'purple'} 
      isActive={isEnabled}
      onClick={onToggle}
      className="group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isEnabled ? 'bg-cyan-500/20' : 'bg-purple-500/20'
          )}>
            <div className={cn(
              isEnabled ? 'text-cyan-400' : 'text-purple-400'
            )}>
              {icon}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isPremium && (
              <span className="text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
                Hunter Pro
              </span>
            )}
            <div className={cn(
              'w-10 h-5 rounded-full transition-colors duration-300 relative',
              isEnabled ? 'bg-cyan-500' : 'bg-muted'
            )}>
              <div className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                isEnabled ? 'left-5' : 'left-0.5'
              )} />
            </div>
          </div>
        </div>
        
        <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </FuturisticCard>
  );
};

export default FuturisticCard;
