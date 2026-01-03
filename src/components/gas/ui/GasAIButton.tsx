import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface GasAIButtonProps {
  onClick?: () => void;
}

const GasAIButton = ({ onClick }: GasAIButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full p-[2px] rounded-2xl overflow-hidden group transition-all duration-500 
                 shadow-lg shadow-cyan-500/20 hover:shadow-orange-500/30 hover:shadow-xl
                 lg:hover:scale-[1.02] active:scale-[0.98]"
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-fuchsia-500 via-cyan-400 to-blue-500 
                      opacity-80 blur-sm animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-500 via-cyan-500 to-blue-600" />
      
      {/* Inner content */}
      <div className="relative bg-black/95 rounded-2xl p-5 flex items-center gap-4 overflow-hidden">
        {/* Corner glows */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/30 rounded-full blur-2xl" />
        
        {/* Floating orbs */}
        <div className="absolute top-3 right-16 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-60" />
        <div className="absolute bottom-4 left-24 w-1 h-1 bg-cyan-400 rounded-full opacity-50" />
        
        {/* Shine sweep effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        
        {/* Subtle highlight lines */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        
        {/* Icon */}
        <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-cyan-500/20 
                        flex items-center justify-center border border-orange-500/30 shadow-lg shadow-orange-500/20">
          <Sparkles className="w-7 h-7 text-orange-400" />
        </div>
        
        {/* Text content */}
        <div className="relative z-10 flex-1 text-left">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              IA
            </span>
            <span>Conektao</span>
          </h3>
          <p className="text-sm text-white/60">Tu copiloto de negocio</p>
        </div>
        
        {/* Right sparkle decoration */}
        <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/10 to-orange-500/10 
                        flex items-center justify-center border border-white/10
                        group-hover:border-cyan-500/30 transition-colors duration-300">
          <Sparkles className="w-4 h-4 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.button>
  );
};

export default GasAIButton;
