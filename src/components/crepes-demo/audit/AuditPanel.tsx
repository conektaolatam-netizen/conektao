import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, TrendingUp, TrendingDown, Users, AlertCircle, Package, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StaffAlert {
  type: string;
  severity: string;
  employee: string;
  message: string;
  metric: string;
}

interface ErrorPattern {
  product: string;
  errorType: string;
  count: number;
  trend: string;
  recommendation: string;
}

interface ProductRotation {
  product: string;
  category: string;
  currentSales: number;
  expectedSales: number;
  variance: number;
  trend: string;
}

interface AuditData {
  overallScore: number;
  scoreBreakdown: {
    staff: number;
    operations: number;
    quality: number;
    efficiency: number;
  };
  staffAlerts: StaffAlert[];
  errorPatterns: ErrorPattern[];
  productRotation: {
    underperforming: ProductRotation[];
    recommendation: string;
  };
  dailySummary: string;
  generatedAt: string;
}

interface AuditPanelProps {
  branchId?: string;
}

const AuditPanel: React.FC<AuditPanelProps> = ({ branchId = "zona-t" }) => {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'errors' | 'rotation'>('overview');

  const fetchAudit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/crepes-branch-audit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c3F2amNnY3Vrb3N1c2tzdWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjgzMTIsImV4cCI6MjA2OTUwNDMxMn0.aTDy7G6E9olaZwtpLW3Lgw4MAfeO704xI4QfIR0SDrg`,
          },
          body: JSON.stringify({ branch_id: branchId }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener auditoría');
      }

      const data = await response.json();
      setAuditData(data);
    } catch (err) {
      console.error('Error fetching audit:', err);
      setError('No se pudo cargar la auditoría. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [branchId]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-white text-rose-600 border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.15)]';
      case 'warning': return 'bg-white text-amber-600 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
      default: return 'bg-white text-sky-600 border-sky-400/60 shadow-[0_0_8px_rgba(14,165,233,0.15)]';
    }
  };

  const tabs = [
    { id: 'overview', label: '📊', icon: Shield },
    { id: 'staff', label: '👥', icon: Users },
    { id: 'errors', label: '⚠️', icon: AlertCircle },
    { id: 'rotation', label: '📦', icon: Package },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[#F0ECE6] rounded" />
          <div className="h-32 bg-[#F0ECE6] rounded" />
          <div className="h-24 bg-[#F0ECE6] rounded" />
        </div>
      </div>
    );
  }

  if (!auditData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getScoreBackground(auditData.overallScore)} flex items-center justify-center shadow-sm`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#4A3728]">Auditoría</h2>
              <p className="text-xs text-[#8B7355]">Estado de la sucursal</p>
            </div>
          </div>
          <button
            onClick={fetchAudit}
            className="p-1.5 text-[#D4C4B0]/30 hover:text-[#8B7355]/50 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#8B7355] mb-1">🏥 Estado General</p>
            <motion.p
              className={`text-4xl font-bold ${getScoreColor(auditData.overallScore)}`}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              {auditData.overallScore}%
            </motion.p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { key: 'staff', label: '👥' },
              { key: 'operations', label: '⚙️' },
              { key: 'quality', label: '✨' },
              { key: 'efficiency', label: '⚡' },
            ].map(({ key, label }) => (
              <div key={key} className="text-center">
                <p className="text-[10px] text-[#8B7355]">{label}</p>
                <p className={`text-sm font-bold ${getScoreColor(auditData.scoreBreakdown[key as keyof typeof auditData.scoreBreakdown])}`}>
                  {auditData.scoreBreakdown[key as keyof typeof auditData.scoreBreakdown]}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6] space-y-2">
          {auditData.dailySummary.split('\n\n').filter(block => block.trim()).map((block, index) => (
            <div 
              key={index} 
              className={`text-xs text-[#4A3728] leading-relaxed ${index > 0 ? 'pt-2 border-t border-[#F0ECE6]' : ''}`}
            >
              {block.split('\n').map((line, lineIndex) => (
                <p key={lineIndex} className={lineIndex > 0 ? 'mt-0.5 text-[#6B5744]' : 'font-medium'}>
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-[#4A3728] text-white shadow-sm' 
                : 'text-[#8B7355] hover:bg-[#F0ECE6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 pb-5">
        {activeTab === 'overview' && (
          <div className="space-y-2">
            {[
              { key: 'staff', label: '👥 Personal', value: auditData.scoreBreakdown.staff },
              { key: 'operations', label: '⚙️ Operaciones', value: auditData.scoreBreakdown.operations },
              { key: 'quality', label: '✨ Calidad', value: auditData.scoreBreakdown.quality },
              { key: 'efficiency', label: '⚡ Eficiencia', value: auditData.scoreBreakdown.efficiency },
            ].map(({ key, label, value }) => (
              <div key={key} className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#5C4033] font-medium">{label}</span>
                  <span className={`font-bold ${getScoreColor(value)}`}>{value}%</span>
                </div>
                <div className="h-1.5 bg-[#F0ECE6] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreBackground(value)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-2">
            {auditData.staffAlerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-xl border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {alert.type === 'lateness' && <Clock className="w-3.5 h-3.5 mt-0.5" />}
                    {alert.type === 'absence' && <Users className="w-3.5 h-3.5 mt-0.5" />}
                    {alert.type === 'performance' && <TrendingDown className="w-3.5 h-3.5 mt-0.5" />}
                    <div>
                      <p className="text-xs font-medium">{alert.message}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{alert.employee}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.5 rounded border">
                    {alert.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-2">
            {auditData.errorPatterns.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl bg-white border border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <p className="font-medium text-xs text-[#4A3728]">{error.product}</p>
                    <p className="text-[10px] text-[#6B5744]">{error.errorType}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-rose-600">{error.count}</span>
                    {error.trend === 'increasing' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                    ) : error.trend === 'decreasing' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                    ) : null}
                  </div>
                </div>
                <p className="text-[10px] text-[#5C4033] bg-[#FAFAF8] p-1.5 rounded border border-rose-200/40">
                  💡 {error.recommendation}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'rotation' && (
          <div className="space-y-2">
            {auditData.productRotation.underperforming.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
              >
                <div>
                  <p className="font-medium text-xs text-[#4A3728]">{product.product}</p>
                  <p className="text-[10px] text-[#6B5744]">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px]">
                    <span className="text-[#5C4033]">{product.currentSales}</span>
                    <span className="text-[#8B7355]"> / {product.expectedSales}</span>
                  </p>
                  <p className="text-xs font-bold text-rose-600">{product.variance}%</p>
                </div>
              </motion.div>
            ))}
            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#F0ECE6]">
              <p className="text-xs text-[#4A3728] leading-relaxed">
                {auditData.productRotation.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuditPanel;
