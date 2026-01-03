import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type GasModuleColor = 'green' | 'orange' | 'coral' | 'blue' | 'turquoise' | 'purple' | 'cyan';

interface GasAppButtonProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: GasModuleColor;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  onClick: () => void;
  className?: string;
}

const moduleStyles: Record<GasModuleColor, {
  iconBg: string;
  iconColor: string;
  borderGlow: string;
  glowHover: string;
  accentLine: string;
}> = {
  green: {
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    borderGlow: 'border-emerald-500/20 hover:border-emerald-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(160_84%_39%/0.25)]',
    accentLine: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
  },
  orange: {
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    borderGlow: 'border-orange-500/20 hover:border-orange-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(25_100%_50%/0.25)]',
    accentLine: 'bg-gradient-to-b from-orange-400 to-orange-600',
  },
  coral: {
    iconBg: 'bg-rose-400/15',
    iconColor: 'text-rose-400',
    borderGlow: 'border-rose-400/20 hover:border-rose-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(350_89%_60%/0.2)]',
    accentLine: 'bg-gradient-to-b from-rose-400 to-rose-500',
  },
  blue: {
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    borderGlow: 'border-blue-500/20 hover:border-blue-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(217_91%_60%/0.25)]',
    accentLine: 'bg-gradient-to-b from-blue-400 to-blue-600',
  },
  turquoise: {
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    borderGlow: 'border-teal-500/20 hover:border-teal-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(174_100%_29%/0.25)]',
    accentLine: 'bg-gradient-to-b from-teal-400 to-teal-600',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    borderGlow: 'border-purple-500/20 hover:border-purple-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(270_70%_50%/0.25)]',
    accentLine: 'bg-gradient-to-b from-purple-400 to-purple-600',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    borderGlow: 'border-cyan-500/20 hover:border-cyan-400/40',
    glowHover: 'hover:shadow-[0_0_40px_hsl(190_90%_50%/0.25)]',
    accentLine: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
  },
};

const GasAppButton: React.FC<GasAppButtonProps> = ({
  icon,
  title,
  subtitle,
  color,
  badge,
  badgeVariant = 'secondary',
  onClick,
  className,
}) => {
  const styles = moduleStyles[color];

  return (
    <motion.button
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        // Base layout - horizontal card
        'relative w-full flex items-center gap-4 p-5',
        // Rounded corners (high radius)
        'rounded-2xl',
        // Dark background with subtle gradient
        'bg-gradient-to-br from-card/90 via-card/70 to-background/80',
        // Backdrop blur for glass effect
        'backdrop-blur-xl',
        // Border with glow
        'border',
        styles.borderGlow,
        // Glow on hover
        styles.glowHover,
        // Smooth transitions
        'transition-all duration-300 ease-out',
        // Group for child animations
        'group cursor-pointer',
        // Overflow hidden for accent line
        'overflow-hidden',
        className
      )}
    >
      {/* Accent line on left edge */}
      <div 
        className={cn(
          'absolute left-0 top-3 bottom-3 w-[3px] rounded-full',
          styles.accentLine,
          'opacity-60 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />

      {/* Icon container */}
      <div 
        className={cn(
          'relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
          styles.iconBg,
          'transition-transform duration-300 group-hover:scale-105'
        )}
      >
        <div className={cn(styles.iconColor, 'transition-all duration-300')}>
          {icon}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <h3 className="text-base font-semibold text-foreground tracking-tight leading-tight">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
          {subtitle}
        </p>
      </div>

      {/* Right section: badge + arrow */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {badge !== undefined && (
          <Badge 
            variant={badgeVariant}
            className={cn(
              'text-xs font-medium px-2.5 py-0.5',
              badgeVariant === 'secondary' && 'bg-muted/60 text-muted-foreground border-border/50'
            )}
          >
            {badge}
          </Badge>
        )}
        
        <div 
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'bg-muted/30 group-hover:bg-muted/50',
            'transition-all duration-300',
            'opacity-60 group-hover:opacity-100',
            'group-hover:translate-x-0.5'
          )}
        >
          <ChevronRight className={cn('w-4 h-4', styles.iconColor)} />
        </div>
      </div>
    </motion.button>
  );
};

export default GasAppButton;
