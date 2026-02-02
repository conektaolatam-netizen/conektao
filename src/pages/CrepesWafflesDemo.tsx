import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DemoCommandCenter from '@/components/crepes-demo/DemoCommandCenter';
import AliciaExperience from '@/components/crepes-demo/AliciaExperience';
import BranchManagerDashboard from '@/components/crepes-demo/BranchManagerDashboard';
import RegionalManagerDashboard from '@/components/crepes-demo/RegionalManagerDashboard';
import GeneralManagerDashboard from '@/components/crepes-demo/GeneralManagerDashboard';
import BackstageFlow from '@/components/crepes-demo/BackstageFlow';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DemoView = 'command-center' | 'alicia' | 'branch-manager' | 'regional-manager' | 'general-manager' | 'backstage';

const CrepesWafflesDemo = () => {
  const [currentView, setCurrentView] = useState<DemoView>('command-center');

  const handleNavigate = (view: DemoView) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('command-center');
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235C4033' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <AnimatePresence mode="wait">
        {currentView !== 'command-center' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-6 left-6 z-50"
          >
            <Button
              variant="outline"
              onClick={handleBack}
              className="bg-white/90 backdrop-blur-sm border-[#5C4033]/20 text-[#5C4033] hover:bg-[#5C4033] hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Centro de Control
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentView === 'command-center' && (
          <motion.div
            key="command-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DemoCommandCenter onNavigate={handleNavigate} />
          </motion.div>
        )}

        {currentView === 'alicia' && (
          <motion.div
            key="alicia"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <AliciaExperience />
          </motion.div>
        )}

        {currentView === 'branch-manager' && (
          <motion.div
            key="branch-manager"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <BranchManagerDashboard />
          </motion.div>
        )}

        {currentView === 'regional-manager' && (
          <motion.div
            key="regional-manager"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <RegionalManagerDashboard />
          </motion.div>
        )}

        {currentView === 'general-manager' && (
          <motion.div
            key="general-manager"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <GeneralManagerDashboard />
          </motion.div>
        )}

        {currentView === 'backstage' && (
          <motion.div
            key="backstage"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.5 }}
          >
            <BackstageFlow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrepesWafflesDemo;
