import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Phone, MapPin, AlertTriangle, Sparkles, Users, BarChart3 } from 'lucide-react';

interface Insight {
  id: string;
  icon: React.ElementType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action: string;
}

const insights: Insight[] = [
  {
    id: 'sales-drop',
    icon: TrendingDown,
    severity: 'critical',
    title: '¡Ojo, Rodrigo! Las ventas bajaron',
    message: 'Las ventas de todo Crepes & Waffles han caído un 3.5% esta semana comparado con la semana anterior. Son $99.7M menos. Esto no debería pasar.',
    action: '📞 Llama al equipo de marketing y programa una reunión para mañana. Hay que reaccionar ya.',
  },
  {
    id: 'eje-cafetero',
    icon: MapPin,
    severity: 'critical',
    title: 'El Eje Cafetero necesita tu atención',
    message: 'Pereira (58%) y Armenia (65%) están arrastrando la región. El score promedio del Eje Cafetero es 68% — el más bajo del país. Natalia Giraldo no ha podido sola.',
    action: '🚗 Programa una visita al Eje Cafetero esta semana. Pereira es la prioridad #1.',
  },
  {
    id: 'staff-national',
    icon: Users,
    severity: 'warning',
    title: '73 empleados ausentes hoy',
    message: 'De 1,260 empleados, 73 no se presentaron hoy (94.2% de asistencia). Normal es 96%. El Eje Cafetero y Bogotá Norte concentran la mayoría de ausencias.',
    action: '📋 Pídele a RRHH un reporte de ausentismo por región de los últimos 30 días.',
  },
  {
    id: 'medellin-star',
    icon: BarChart3,
    severity: 'info',
    title: 'Medellín es la estrella 🌟',
    message: 'Con 90% de auditoría y $24.5M en ventas hoy, Medellín lidera el país. Juliana Restrepo está haciendo un gran trabajo. Su modelo puede replicarse.',
    action: '💡 Pídele a Juliana que presente su estrategia en el próximo comité nacional.',
  },
];

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-gradient-to-r from-rose-50 to-rose-100/50',
        border: 'border-rose-200',
        iconBg: 'bg-rose-500',
        titleColor: 'text-rose-800',
        actionBg: 'bg-rose-100 border-rose-200',
        actionText: 'text-rose-700',
      };
    case 'warning':
      return {
        bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50',
        border: 'border-amber-200',
        iconBg: 'bg-amber-500',
        titleColor: 'text-amber-800',
        actionBg: 'bg-amber-100 border-amber-200',
        actionText: 'text-amber-700',
      };
    default:
      return {
        bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-500',
        titleColor: 'text-emerald-800',
        actionBg: 'bg-emerald-100 border-emerald-200',
        actionText: 'text-emerald-700',
      };
  }
};

const GeneralOptimizationInsights: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">Alertas para Rodrigo</h2>
            <p className="text-xs text-[#8B7355]">Lo que necesitas saber hoy</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {insights.map((insight, i) => {
          const styles = getSeverityStyles(insight.severity);
          const Icon = insight.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${styles.titleColor} mb-1`}>{insight.title}</p>
                  <p className="text-xs text-[#4A3728] leading-relaxed mb-2">{insight.message}</p>
                  <div className={`p-2.5 rounded-lg border ${styles.actionBg}`}>
                    <p className={`text-xs font-medium ${styles.actionText}`}>{insight.action}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GeneralOptimizationInsights;
