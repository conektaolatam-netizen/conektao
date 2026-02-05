import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import ConditionsAIPanel from './conditions/ConditionsAIPanel';
import AuditPanel from './audit/AuditPanel';
import ConektaoChat from './chat/ConektaoChat';

const BranchManagerDashboard = () => {
  const branchId = "zona-t";
  const city = "Bogotá";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F1] via-[#F5F0E8] to-[#FAF6F1]">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#5C4033]">
                Sucursal Zona T
              </h1>
              <div className="flex items-center gap-2 text-[#5C4033]/60">
                <MapPin className="w-4 h-4" />
                <span>Bogotá, Colombia</span>
                <span className="text-[#5C4033]/30">•</span>
                <span>Gerente de Sucursal</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-sm font-medium">En línea</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* IA de Condiciones - Full Width, Most Important */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConditionsAIPanel branchId={branchId} city={city} />
          </motion.section>

          {/* Two Column Layout: Chat + Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conektao AI Chat */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:h-[600px]"
            >
              <ConektaoChat branchId={branchId} />
            </motion.section>

            {/* Audit Panel */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:max-h-[600px] lg:overflow-y-auto"
            >
              <AuditPanel branchId={branchId} />
            </motion.section>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#5C4033]/40">
            Powered by <span className="font-semibold text-[#5C4033]/60">Conektao AI</span> • 
            Los ojos de un estratega profesional sobre cada sucursal
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BranchManagerDashboard;
