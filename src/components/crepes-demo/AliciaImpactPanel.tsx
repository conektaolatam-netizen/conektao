import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Phone, 
  Percent, 
  Target,
  Users,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AliciaImpactPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AliciaImpactPanel = ({ isOpen, onClose }: AliciaImpactPanelProps) => {
  if (!isOpen) return null;

  const mainImpact = {
    total: '$40.710M',
    currency: 'COP/año',
    description: 'Impacto Total Proyectado'
  };

  const breakdownMetrics = [
    {
      icon: TrendingUp,
      label: 'Ventas adicionales',
      value: '$32.400M',
      sublabel: 'Por mayor conversión',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: ShoppingCart,
      label: 'Revenue por upselling',
      value: '$4.680M',
      sublabel: '31% de clientes añaden productos',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Percent,
      label: 'Ahorro comisiones',
      value: '$2.160M',
      sublabel: 'Migración desde Rappi/iFood',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: Phone,
      label: 'Ahorro call center',
      value: '$1.470M',
      sublabel: '70% llamadas migradas a WhatsApp',
      color: 'from-orange-500 to-amber-600'
    }
  ];

  const conversionStats = [
    { label: 'Conversión actual', value: '15%', icon: Target },
    { label: 'Con ALICIA', value: '35%', icon: Award },
    { label: 'Mejora', value: '+133%', icon: TrendingUp }
  ];

  const operationalStats = [
    { label: 'Pedidos diarios adicionales', value: '+2.000' },
    { label: 'Sucursales proyectadas', value: '200' },
    { label: 'Ticket promedio', value: '$45.000' },
    { label: 'Tiempo implementación', value: '16 semanas' }
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
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
              Impacto de ALICIA
            </motion.h2>
            <p className="text-[#D4B896]/80">
              Proyección financiera para Crepes & Waffles (200 sucursales)
            </p>
          </div>

          {/* Main Impact Number */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-8 p-6 rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4B896]/20 via-[#8B6B4F]/10 to-[#D4B896]/20" />
            <div className="absolute inset-0 border border-[#D4B896]/30 rounded-2xl" />
            <div className="relative text-center">
              <p className="text-[#D4B896] text-sm uppercase tracking-wider mb-2">
                {mainImpact.description}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl md:text-6xl font-bold text-[#F5E6D3]">
                  {mainImpact.total}
                </span>
                <span className="text-xl text-[#D4B896]/80">
                  {mainImpact.currency}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {breakdownMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="relative p-4 rounded-xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[#5C4033]/40 group-hover:bg-[#5C4033]/60 transition-colors" />
                <div className="absolute inset-0 border border-[#D4B896]/20 rounded-xl" />
                <div className="relative flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-[#F5E6D3]">{metric.value}</p>
                    <p className="text-sm font-medium text-[#D4B896]">{metric.label}</p>
                    <p className="text-xs text-[#D4B896]/60 mt-1">{metric.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Conversion Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4B896]" />
              Mejora en Conversión
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {conversionStats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="text-center p-4 rounded-xl bg-[#5C4033]/30 border border-[#D4B896]/20"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-[#D4B896]" />
                  <p className={`text-2xl font-bold ${index === 2 ? 'text-green-400' : 'text-[#F5E6D3]'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#D4B896]/70 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Operational Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-[#F5E6D3] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4B896]" />
              Métricas Operativas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {operationalStats.map((stat) => (
                <div 
                  key={stat.label}
                  className="text-center p-3 rounded-xl bg-[#5C4033]/20 border border-[#D4B896]/10"
                >
                  <p className="text-xl font-bold text-[#F5E6D3]">{stat.value}</p>
                  <p className="text-xs text-[#D4B896]/60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Key Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center p-4 rounded-xl bg-gradient-to-r from-[#D4B896]/10 via-[#8B6B4F]/5 to-[#D4B896]/10 border border-[#D4B896]/20"
          >
            <p className="text-[#D4B896] italic">
              "La calidez de un humano, sin el riesgo emocional.<br />
              La eficiencia de un bot, sin la frialdad robótica."
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
