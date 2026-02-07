import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle, CheckCircle, ChevronRight, ArrowLeft, Users, Package, DollarSign, Clock, MapPin } from 'lucide-react';

interface CriticalBranch {
  id: string;
  name: string;
  region: string;
  score: number;
  status: 'critical' | 'warning';
  issues: Array<{ type: string; severity: string; message: string; metric: string }>;
  recommendations: string[];
  aiSummary: string;
}

const criticalBranches: CriticalBranch[] = [
  {
    id: 'pereira',
    name: 'Crepes & Waffles Pereira',
    region: 'Eje Cafetero',
    score: 58,
    status: 'critical',
    issues: [
      { type: 'staff', severity: 'critical', message: '4 empleados ausentes sin justificación', metric: '6/10' },
      { type: 'inventory', severity: 'critical', message: '6 productos de inventario bajo mínimo', metric: '6 alertas' },
      { type: 'errors', severity: 'critical', message: '12 errores de preparación esta semana', metric: '12/sem' },
      { type: 'satisfaction', severity: 'warning', message: 'Satisfacción del cliente en descenso', metric: '72%' },
    ],
    recommendations: [
      'Programar visita presencial urgente del gerente regional esta semana',
      'Enviar 2 empleados de apoyo desde Manizales para cubrir ausencias',
      'Auditoría de inventario completa: 6 productos están bajo mínimo',
      'Reentrenamiento del equipo de cocina — los errores de preparación son un patrón, no un accidente',
    ],
    aiSummary: 'Pereira lleva 2 semanas en deterioro. El problema principal es la falta de personal: con solo 6 de 10 empleados, el equipo no da abasto. Esto genera errores de preparación en cascada y cae la satisfacción. Necesita intervención presencial esta semana.',
  },
  {
    id: 'armenia',
    name: 'Crepes & Waffles Armenia',
    region: 'Eje Cafetero',
    score: 65,
    status: 'critical',
    issues: [
      { type: 'errors', severity: 'critical', message: 'Errores de preparación recurrentes', metric: '9/sem' },
      { type: 'cash', severity: 'critical', message: 'Diferencia de caja de $320,000 COP', metric: '$320K' },
      { type: 'time', severity: 'warning', message: 'Tiempo de servicio elevado', metric: '18 min' },
    ],
    recommendations: [
      'Revisar cámara de caja para identificar el origen de la diferencia de $320K',
      'Evaluar al jefe de cocina: los 9 errores semanales son un patrón de supervisión',
      'Implementar timer visible en cocina para reducir tiempo de servicio de 18 a 12 min',
    ],
    aiSummary: 'Armenia tiene dos problemas graves: la diferencia de caja recurrente puede ser un tema de control interno, y los errores de preparación sugieren falta de supervisión en cocina. El tiempo de servicio de 18 min amplifica ambos problemas.',
  },
  {
    id: 'calle90',
    name: 'Crepes & Waffles Calle 90',
    region: 'Bogotá Centro',
    score: 71,
    status: 'warning',
    issues: [
      { type: 'time', severity: 'warning', message: 'Tiempo de servicio elevado', metric: '16 min' },
      { type: 'satisfaction', severity: 'warning', message: '2 reclamos de clientes por demora', metric: '2 quejas' },
      { type: 'staff', severity: 'warning', message: 'Rotación de personal alta', metric: '3 renuncias/mes' },
    ],
    recommendations: [
      'Investigar por qué 3 empleados renunciaron este mes — posible problema de clima laboral',
      'Ajustar turnos en hora pico (12-14h) para reducir tiempo de servicio',
      'Evaluar si el gerente de sucursal necesita apoyo o capacitación',
    ],
    aiSummary: 'Calle 90 no es crítica pero va en dirección negativa. La rotación de 3 renuncias en un mes es alarmante — puede haber un problema de liderazgo local. Si no se interviene, en 2 semanas puede pasar a estado crítico.',
  },
];

const GeneralAuditPanel: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<CriticalBranch | null>(null);

  const nationalScore = 92;
  const totalBranches = 42;
  const healthyBranches = 39;

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'staff': return <Users className="w-3.5 h-3.5" />;
      case 'inventory': return <Package className="w-3.5 h-3.5" />;
      case 'cash': return <DollarSign className="w-3.5 h-3.5" />;
      case 'time': return <Clock className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  if (selectedBranch) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
          <button
            onClick={() => setSelectedBranch(null)}
            className="flex items-center gap-1.5 text-xs text-[#8B7355] hover:text-[#4A3728] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a auditoría nacional
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {selectedBranch.status === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <h3 className="text-lg font-bold text-[#4A3728]">{selectedBranch.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#8B7355]">
                <MapPin className="w-3 h-3" />
                {selectedBranch.region}
              </div>
            </div>
            <span className={`text-3xl font-bold ${selectedBranch.score < 65 ? 'text-rose-600' : 'text-amber-600'}`}>
              {selectedBranch.score}%
            </span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="px-5 py-4">
          <div className="p-4 bg-gradient-to-r from-[#FFF5F5] to-[#FFF0EB] rounded-xl border border-rose-200">
            <p className="text-xs font-semibold text-rose-800 mb-1.5">🧠 Análisis de Conektao AI</p>
            <p className="text-xs text-rose-700 leading-relaxed">{selectedBranch.aiSummary}</p>
          </div>
        </div>

        {/* Issues */}
        <div className="px-5 pb-4 space-y-2">
          <p className="text-xs font-semibold text-[#4A3728]">⚠️ Problemas detectados</p>
          {selectedBranch.issues.map((issue, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-3 rounded-xl border ${
                issue.severity === 'critical' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={issue.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}>
                    {getIssueIcon(issue.type)}
                  </span>
                  <p className="text-xs text-[#4A3728]">{issue.message}</p>
                </div>
                <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.5 rounded border flex-shrink-0 ml-2">
                  {issue.metric}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="px-5 pb-5 space-y-2">
          <p className="text-xs font-semibold text-[#4A3728]">💡 Recomendaciones IA</p>
          {selectedBranch.recommendations.map((rec, i) => (
            <div key={i} className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <p className="text-xs text-sky-800">
                <span className="font-semibold">{i + 1}.</span> {rec}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">Auditoría Nacional</h2>
            <p className="text-xs text-[#8B7355]">{totalBranches} sucursales monitoreadas</p>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[#8B7355]">Salud nacional</p>
            <motion.p
              className="text-4xl font-bold text-emerald-600"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {nationalScore}%
            </motion.p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-lg font-bold text-emerald-600">{healthyBranches}</p>
              <p className="text-[10px] text-emerald-700">Saludables</p>
            </div>
            <div className="px-3 py-2 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-lg font-bold text-rose-600">3</p>
              <p className="text-[10px] text-rose-700">Con alertas</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
          <p className="text-xs text-[#6B5744] leading-relaxed">
            El <span className="font-semibold">92%</span> de Crepes & Waffles está funcionando bien. Solo <span className="font-semibold text-rose-600">3 restaurantes</span> tienen alertas: <span className="font-semibold text-rose-600">2 en el Eje Cafetero</span> (Pereira y Armenia) y <span className="font-semibold text-amber-600">1 en Bogotá</span> (Calle 90).
          </p>
        </div>
      </div>

      {/* Critical Branches */}
      <div className="px-5 pb-5 space-y-2">
        <p className="text-xs font-semibold text-[#8B7355] mb-1">Sucursales con alertas</p>
        {criticalBranches.map((branch, i) => (
          <motion.button
            key={branch.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelectedBranch(branch)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              branch.status === 'critical'
                ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {branch.status === 'critical' ? (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-[#4A3728]">{branch.name}</p>
                <p className="text-[10px] text-[#8B7355]">
                  {branch.region} · {branch.issues.length} problemas detectados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${branch.score < 65 ? 'text-rose-600' : 'text-amber-600'}`}>
                {branch.score}%
              </span>
              <ChevronRight className="w-4 h-4 text-[#D4C4B0]" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default GeneralAuditPanel;
