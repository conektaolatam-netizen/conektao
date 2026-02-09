import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingDown, Sparkles } from 'lucide-react';
import GeneralConektaoChat from './general/GeneralConektaoChat';
import GeneralAuditPanel from './general/GeneralAuditPanel';
import GeneralNationalMap from './general/GeneralNationalMap';
import GeneralOptimizationInsights from './general/GeneralOptimizationInsights';
const GeneralManagerDashboard = () => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
  return <div className="min-h-screen bg-[#FAFAF8]">
      <div className="relative max-w-7xl mx-auto p-6 pt-6">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#4A3728]">
                Hola, Rodrigo 👋
              </h1>
              <div className="flex items-center gap-2 text-[#8B7355]">
                <Building2 className="w-4 h-4" />
                <span>150 Sucursales</span>
                <span className="text-[#D4C4B0]">•</span>
                <span>8 Regiones</span>
                <span className="text-[#D4C4B0]">•</span>
                <span>Gerente General</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8B7355]">Ventas del día (nacional)</p>
              <p className="text-2xl font-bold text-[#4A3728]">{formatCurrency(3723000000)}</p>
              <p className="text-xs text-rose-600 flex items-center justify-end gap-1">
                <TrendingDown className="w-3 h-3" />
                -3.5% vs semana pasada
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Row 1: Optimization Insights (full width — most visible) */}
          <motion.section initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }}>
            <GeneralOptimizationInsights />
          </motion.section>

          {/* Row 2: Map + Audit side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.section initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.15
          }}>
              <GeneralNationalMap />
            </motion.section>

            <motion.section initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }}>
              <GeneralAuditPanel />
            </motion.section>
          </div>

          {/* Row 3: Conektao AI Chat - Full Width */}
          <motion.section initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.25
        }} className="h-[600px]">
            <GeneralConektaoChat />
          </motion.section>
        </div>

        {/* Footer */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.4
      }} className="mt-10 text-center">
          <p className="text-sm text-[#8B7355]">
            Powered by <span className="font-semibold text-[#5C4033]">Conektao AI</span> • 
            Inteligencia nacional en tiempo real
          </p>
        </motion.div>
      </div>
    </div>;
};
export default GeneralManagerDashboard;