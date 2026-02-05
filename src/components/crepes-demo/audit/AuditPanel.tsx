import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, TrendingUp, TrendingDown, Users, AlertCircle, Package, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
      case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Resumen', icon: Shield },
    { id: 'staff', label: '👥 Personal', icon: Users },
    { id: 'errors', label: '⚠️ Errores', icon: AlertCircle },
    { id: 'rotation', label: '📦 Rotación', icon: Package },
  ];

  if (isLoading) {
    return (
      <Card className="bg-white border-[#D4C4B0] shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-[#E8DFD4] rounded" />
            <div className="h-32 bg-[#E8DFD4] rounded" />
            <div className="h-24 bg-[#E8DFD4] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!auditData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreBackground(auditData.overallScore)} flex items-center justify-center shadow-md`}
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-[#4A3728]">Auditoría</h2>
            <p className="text-sm text-[#8B7355]">Estado de la sucursal</p>
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

      {/* Score Card */}
      <Card className="bg-white border-[#D4C4B0] shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">🏥 Estado General</p>
              <motion.p
                className={`text-5xl font-bold ${getScoreColor(auditData.overallScore)}`}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                {auditData.overallScore}%
              </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { key: 'staff', label: '👥 Personal' },
                { key: 'operations', label: '⚙️ Operaciones' },
                { key: 'quality', label: '✨ Calidad' },
                { key: 'efficiency', label: '⚡ Eficiencia' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs text-[#8B7355]">{label}</p>
                  <p className={`text-lg font-bold ${getScoreColor(auditData.scoreBreakdown[key as keyof typeof auditData.scoreBreakdown])}`}>
                    {auditData.scoreBreakdown[key as keyof typeof auditData.scoreBreakdown]}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary - structured blocks */}
          <div className="p-4 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4] space-y-3">
            {auditData.dailySummary.split('\n\n').filter(block => block.trim()).map((block, index) => (
              <div 
                key={index} 
                className={`text-sm text-[#4A3728] leading-relaxed ${index > 0 ? 'pt-3 border-t border-[#E8DFD4]/50' : ''}`}
              >
                {block.split('\n').map((line, lineIndex) => (
                  <p key={lineIndex} className={lineIndex > 0 ? 'mt-1 text-[#6B5744]' : 'font-medium'}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs - lighter colors for better readability */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id 
              ? "bg-[#5C4033] hover:bg-[#4A3728] text-white" 
              : "border-[#E8DFD4] bg-[#FDF8F3] text-[#5C4033] hover:bg-[#F5EDE4] hover:border-[#D4C4B0]"
            }
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="bg-white border-[#D4C4B0] shadow-sm">
        <CardContent className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[#4A3728]">📈 Métricas del Día</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'staff', label: '👥 Personal', value: auditData.scoreBreakdown.staff },
                  { key: 'operations', label: '⚙️ Operaciones', value: auditData.scoreBreakdown.operations },
                  { key: 'quality', label: '✨ Calidad', value: auditData.scoreBreakdown.quality },
                  { key: 'efficiency', label: '⚡ Eficiencia', value: auditData.scoreBreakdown.efficiency },
                ].map(({ key, label, value }) => (
                  <div key={key} className="p-3 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4]">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#5C4033] font-medium">{label}</span>
                      <span className={`font-bold ${getScoreColor(value)}`}>{value}%</span>
                    </div>
                    <div className="h-2 bg-[#E8DFD4] rounded-full overflow-hidden">
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
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4A3728] mb-3">Alertas de Personal</h3>
              {auditData.staffAlerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {alert.type === 'lateness' && <Clock className="w-4 h-4 mt-0.5" />}
                      {alert.type === 'absence' && <Users className="w-4 h-4 mt-0.5" />}
                      {alert.type === 'performance' && <TrendingDown className="w-4 h-4 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs opacity-70 mt-1">{alert.employee}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-white/70 px-2 py-1 rounded border">
                      {alert.metric}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4A3728] mb-3">Patrones de Errores</h3>
              {auditData.errorPatterns.map((error, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#4A3728]">{error.product}</p>
                      <p className="text-sm text-[#6B5744]">{error.errorType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-rose-600">{error.count}</span>
                      {error.trend === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                      ) : error.trend === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-[#5C4033] bg-white/70 p-2 rounded border border-rose-100">
                    💡 {error.recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'rotation' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[#4A3728]">Productos con Baja Rotación</h3>
              <div className="space-y-2">
                {auditData.productRotation.underperforming.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div>
                      <p className="font-medium text-[#4A3728]">{product.product}</p>
                      <p className="text-xs text-[#6B5744]">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-[#5C4033]">{product.currentSales}</span>
                        <span className="text-[#8B7355]"> / {product.expectedSales}</span>
                      </p>
                      <p className="text-sm font-bold text-rose-600">{product.variance}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4]">
                <p className="text-sm text-[#4A3728] leading-relaxed">
                  {auditData.productRotation.recommendation}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuditPanel;
