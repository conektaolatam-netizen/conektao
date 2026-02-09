import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle, ChevronRight, CheckCircle, ArrowLeft, Lightbulb, Users, Package, DollarSign, X } from 'lucide-react';
interface BranchAudit {
  id: string;
  name: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  salestoday: number;
  salesYesterday: number;
  staffPresent: string;
  topIssue: string | null;
  aiSummary: string;
  details?: {
    issues: Array<{
      type: string;
      severity: string;
      message: string;
      metric: string;
    }>;
    recommendations: string[];
  };
  lat: number;
  lng: number;
}
interface RegionalAuditData {
  regionalScore: number;
  totalBranches: number;
  healthyBranches: number;
  warningBranches: number;
  criticalBranches: number;
  summary: string;
  branches: BranchAudit[];
}
interface RegionalAuditPanelProps {
  onBranchSelect?: (branch: BranchAudit) => void;
}
const RegionalAuditPanel: React.FC<RegionalAuditPanelProps> = ({
  onBranchSelect
}) => {
  const [data, setData] = useState<RegionalAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<BranchAudit | null>(null);
  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crepes-regional-audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({})
        });
        if (!response.ok) throw new Error('Error');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching regional audit:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudit();
  }, []);
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v);
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };
  const getStatusIcon = (status: string) => {
    if (status === 'critical') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };
  const getStatusBg = (status: string) => {
    if (status === 'critical') return 'bg-white border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.15)] hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    if (status === 'warning') return 'bg-white border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    return 'bg-white border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.12)] hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]';
  };
  if (isLoading) {
    return <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[#F0ECE6] rounded" />
          <div className="h-24 bg-[#F0ECE6] rounded" />
          <div className="h-20 bg-[#F0ECE6] rounded" />
          <div className="h-20 bg-[#F0ECE6] rounded" />
        </div>
      </div>;
  }
  if (!data) return null;

  // Branch detail view
  if (selectedBranch) {
    return <motion.div initial={{
      opacity: 0,
      x: 20
    }} animate={{
      opacity: 1,
      x: 0
    }} className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
        {/* Detail Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
          <button onClick={() => setSelectedBranch(null)} className="flex items-center gap-1.5 text-xs text-[#8B7355] hover:text-[#4A3728] mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la región
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(selectedBranch.status)}
              <div>
                <h3 className="text-lg font-bold text-[#4A3728]">{selectedBranch.name}</h3>
                <p className="text-xs text-[#8B7355]">Score de auditoría</p>
              </div>
            </div>
            <span className={`text-3xl font-bold ${getScoreColor(selectedBranch.score)}`}>
              {selectedBranch.score}%
            </span>
          </div>
        </div>

        {/* Sales summary */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
            <p className="text-[10px] text-[#8B7355] mb-0.5">Ventas hoy</p>
            <p className="text-sm font-bold text-[#4A3728]">{formatCurrency(selectedBranch.salestoday)}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
            <p className="text-[10px] text-[#8B7355] mb-0.5">Ventas ayer</p>
            <p className="text-sm font-bold text-[#4A3728]">{formatCurrency(selectedBranch.salesYesterday)}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
            <p className="text-[10px] text-[#8B7355] mb-0.5">Personal</p>
            <p className="text-sm font-bold text-[#4A3728]">{selectedBranch.staffPresent}</p>
          </div>
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
            <p className="text-[10px] text-[#8B7355] mb-0.5">Estado</p>
            <p className={`text-sm font-bold ${getScoreColor(selectedBranch.score)}`}>
              {selectedBranch.status === 'critical' ? '🔴 Crítico' : selectedBranch.status === 'warning' ? '🟡 Atención' : '🟢 Saludable'}
            </p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="px-5 pb-4">
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
            <p className="text-xs font-medium text-[#4A3728] mb-1">🧠 Resumen IA</p>
            <p className="text-xs text-[#6B5744] leading-relaxed">{selectedBranch.aiSummary}</p>
          </div>
        </div>

        {/* Issues (if any) */}
        {selectedBranch.details?.issues && <div className="px-5 pb-4 space-y-2">
            <p className="text-xs font-semibold text-[#4A3728]">⚠️ Problemas detectados</p>
            {selectedBranch.details.issues.map((issue, i) => <motion.div key={i} initial={{
          opacity: 0,
          x: -10
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: i * 0.1
        }} className={`p-3 rounded-xl border ${issue.severity === 'critical' ? 'bg-white border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.15)]' : 'bg-white border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {issue.type === 'staff' && <Users className="w-3.5 h-3.5 mt-0.5 text-rose-500" />}
                    {issue.type === 'inventory' && <Package className="w-3.5 h-3.5 mt-0.5 text-rose-500" />}
                    {issue.type === 'errors' && <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-500" />}
                    {issue.type === 'cash' && <DollarSign className="w-3.5 h-3.5 mt-0.5 text-amber-500" />}
                    <p className="text-xs text-[#4A3728]">{issue.message}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.5 rounded border flex-shrink-0 ml-2">
                    {issue.metric}
                  </span>
                </div>
              </motion.div>)}
          </div>}

        {/* Recommendations */}
        {selectedBranch.details?.recommendations && <div className="px-5 pb-5 space-y-2">
            <p className="text-xs font-semibold text-[#4A3728]">💡 Recomendaciones IA</p>
            {selectedBranch.details.recommendations.map((rec, i) => <div key={i} className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <p className="text-xs text-sky-800">
                  <span className="font-semibold">{i + 1}.</span> {rec}
                </p>
              </div>)}
          </div>}
      </motion.div>;
  }

  // Main overview
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${data.regionalScore >= 80 ? 'from-emerald-500 to-emerald-600' : 'from-amber-500 to-amber-600'} flex items-center justify-center shadow-sm`}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">AuditorIA Regional</h2>
            <p className="text-xs text-[#8B7355]">{data.totalBranches} sucursales monitoreadas</p>
          </div>
        </div>
      </div>

      {/* Score + Summary */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[#8B7355]">Salud regional</p>
            <motion.p className={`text-4xl font-bold ${getScoreColor(data.regionalScore)}`} initial={{
            scale: 0.5
          }} animate={{
            scale: 1
          }} transition={{
            type: 'spring'
          }}>
              {data.regionalScore}%
            </motion.p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="px-3 py-2 bg-white rounded-xl border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.12)]">
              <p className="text-lg font-bold text-emerald-600">{data.healthyBranches}</p>
              <p className="text-[10px] text-emerald-600">Saludables</p>
            </div>
            <div className="px-3 py-2 bg-white rounded-xl border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.12)]">
              <p className="text-lg font-bold text-amber-600">{data.warningBranches}</p>
              <p className="text-[10px] text-amber-600">Atención</p>
            </div>
            <div className="px-3 py-2 bg-white rounded-xl border border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.12)]">
              <p className="text-lg font-bold text-rose-600">{data.criticalBranches}</p>
              <p className="text-[10px] text-rose-600">Críticas</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#6B5744] bg-[#FAFAF8] p-3 rounded-xl border border-[#F0ECE6]">
          {data.summary}
        </p>
      </div>

      {/* Branch List */}
      <div className="px-5 pb-5 space-y-2">
        <p className="text-xs font-semibold text-[#8B7355] mb-1">Sucursales</p>
        {data.branches.sort((a, b) => a.score - b.score).map((branch, i) => <motion.button key={branch.id} initial={{
        opacity: 0,
        x: -10
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        delay: i * 0.05
      }} onClick={() => setSelectedBranch(branch)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${getStatusBg(branch.status)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(branch.status)}
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4A3728]">{branch.name}</p>
                  <p className="text-[10px] text-[#8B7355]">
                    {branch.topIssue || 'Sin alertas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getScoreColor(branch.score)}`}>
                  {branch.score}%
                </span>
                <ChevronRight className="w-4 h-4 text-[#D4C4B0]" />
              </div>
            </motion.button>)}
      </div>
    </motion.div>;
};
export default RegionalAuditPanel;