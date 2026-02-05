import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  ShoppingCart, 
  Phone, 
  Percent, 
  Target,
  ArrowDownRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AliciaImpactPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AliciaImpactPanel = ({ isOpen, onClose }: AliciaImpactPanelProps) => {
  if (!isOpen) return null;

  const impactMetrics = [
    {
      icon: TrendingUp,
      label: 'Conversión',
      value: '+67% - 133%',
      sublabel: 'Chat a pedido completado',
      color: 'from-green-500 to-emerald-600',
      isPositive: true
    },
    {
      icon: ShoppingCart,
      label: 'Ticket Promedio',
      value: '+15%',
      sublabel: 'Por recomendaciones inteligentes',
      color: 'from-blue-500 to-cyan-600',
      isPositive: true
    },
    {
      icon: Sparkles,
      label: 'Upselling',
      value: '+14%',
      sublabel: 'Revenue adicional por sugerencias',
      color: 'from-purple-500 to-violet-600',
      isPositive: true
    },
    {
      icon: ArrowDownRight,
      label: 'Abandono',
      value: '-29% - 34%',
      sublabel: 'Recuperación de carritos',
      color: 'from-amber-500 to-orange-600',
      isPositive: false
    },
    {
      icon: Phone,
      label: 'Call Center',
      value: '-70% - 80%',
      sublabel: 'Reducción de costos operativos',
      color: 'from-rose-500 to-pink-600',
      isPositive: false
    },
    {
      icon: Percent,
      label: 'Comisiones Terceros',
      value: '-15% - 30%',
      sublabel: 'Ahorro vs Rappi/iFood',
      color: 'from-teal-500 to-cyan-600',
      isPositive: false
    }
  ];

  const sources = [
    { name: 'Conferbot', year: '2024' },
    { name: 'Marketing LTB', year: '2025' },
    { name: 'IBM/Gartner', year: '2024' },
    { name: 'Gallabox', year: '2025' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D2914] via-[#5C4033] to-[#4A3525] rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-3xl" />
        
        {/* Border glow */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-[#D4B896]/40 via-transparent to-[#D4B896]/40 rounded-3xl blur-sm" />
        
        <div className="relative p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#5C4033]/50 text-[#D4B896] hover:bg-[#5C4033] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#F5E6D3] via-[#D4B896] to-[#F5E6D3] bg-clip-text text-transparent mb-2"
            >
              Impacto Proyectado de ALICIA
            </motion.h2>
            <p className="text-[#D4B896]/80 text-sm">
              Basado en +1,200 negocios verificados
            </p>
          </div>

          {/* Impact Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="relative p-5 rounded-xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[#5C4033]/40 group-hover:bg-[#5C4033]/60 transition-colors" />
                <div className="absolute inset-0 border border-[#D4B896]/20 rounded-xl" />
                <div className="relative flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-2xl font-bold ${metric.isPositive ? 'text-green-400' : 'text-[#F5E6D3]'}`}>
                      {metric.value}
                    </p>
                    <p className="text-sm font-medium text-[#D4B896]">{metric.label}</p>
                    <p className="text-xs text-[#D4B896]/60 mt-1">{metric.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How to interpret */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6 p-4 rounded-xl bg-[#5C4033]/30 border border-[#D4B896]/20"
          >
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-[#D4B896] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-[#D4B896] font-medium mb-1">
                  ¿Cómo interpretar estos datos?
                </p>
                <p className="text-xs text-[#D4B896]/70">
                  Estos rangos reflejan resultados reales en empresas similares. 
                  El impacto específico para Crepes & Waffles dependerá de su volumen actual, 
                  canales activos y velocidad de adopción.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sources */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-6"
          >
            <p className="text-xs text-[#D4B896]/50 mb-2">Fuentes de industria:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {sources.map((source) => (
                <span
                  key={source.name}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#5C4033]/30 border border-[#D4B896]/10 text-xs text-[#D4B896]/70"
                >
                  {source.name} {source.year}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </span>
              ))}
            </div>
          </motion.div>

          {/* Key Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center p-4 rounded-xl bg-gradient-to-r from-[#D4B896]/10 via-[#8B6B4F]/5 to-[#D4B896]/10 border border-[#D4B896]/20"
          >
            <p className="text-[#D4B896] italic text-sm">
              "Ustedes ponen los números de hoy.<br />
              ALICIA proyecta el impacto de mañana."
            </p>
          </motion.div>

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-[#5C4033] to-[#8B6B4F] text-[#F5E6D3] hover:shadow-[#D4B896]/20 hover:shadow-lg px-8"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AliciaImpactPanel;
