import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import ConditionsAIPanel from './conditions/ConditionsAIPanel';
import AuditPanel from './audit/AuditPanel';
import ConektaoChat from './chat/ConektaoChat';
import StaffSchedulePanel from './schedule/StaffSchedulePanel';
import AliciaVoiceButton from './voice/AliciaVoiceButton';

const BranchManagerDashboard = () => {
  const branchId = "zona-t";
  const city = "Bogotá";

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="relative max-w-7xl mx-auto p-6 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#4A3728]">
                Sucursal Zona T
              </h1>
              <div className="flex items-center gap-2 text-[#8B7355]">
                <MapPin className="w-4 h-4" />
                <span>Bogotá, Colombia</span>
                <span className="text-[#D4C4B0]">•</span>
                <span>Gerente de Sucursal</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 text-xs font-medium">En línea</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* IA de Condiciones - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConditionsAIPanel branchId={branchId} city={city} />
          </motion.section>

          {/* Staff Schedule + Audit - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3"
            >
              <StaffSchedulePanel />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <AuditPanel branchId={branchId} />
            </motion.section>
          </div>

          {/* Conektao AI Chat - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="h-[600px]"
          >
            <ConektaoChat branchId={branchId} />
          </motion.section>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[#8B7355]">
            Powered by <span className="font-semibold text-[#5C4033]">Conektao AI</span> • 
            Los ojos de un estratega profesional sobre cada sucursal
          </p>
        </motion.div>
      </div>

      {/* ALICIA Voice Agent - Floating Button */}
      <AliciaVoiceButton />
    </div>
  );
};

export default BranchManagerDashboard;
