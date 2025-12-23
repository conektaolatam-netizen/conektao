import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PreventiveAlert } from '@/hooks/usePreventiveAlerts';

interface AliciaPreventiveAlertProps {
  alert: PreventiveAlert | null;
  onDismiss: () => void;
}

const AliciaPreventiveAlert: React.FC<AliciaPreventiveAlertProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'critical';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onDismiss}
        />

        {/* Alert Card */}
        <motion.div
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl alicia-surface border alicia-border"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Gradient Header */}
          <div className={`p-4 ${isCritical ? 'bg-gradient-to-r from-red-600/20 to-red-500/10' : 'alicia-gradient'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isCritical ? 'bg-red-500/20' : 'bg-white/10'}`}>
                {isCritical ? (
                  <XCircle className="h-6 w-6 text-red-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {alert.title}
                </h3>
                <p className="text-xs text-white/60">
                  AlicIA • Alerta preventiva
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 bg-[#0a0a0a]">
            <p className="text-gray-300 leading-relaxed mb-6">
              {alert.message}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {alert.actions.secondary && (
                <Button
                  variant="ghost"
                  onClick={alert.actions.secondary.action}
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                >
                  {alert.actions.secondary.label}
                </Button>
              )}
              <Button
                onClick={alert.actions.primary.action}
                className={isCritical 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'alicia-gradient text-white hover:opacity-90'
                }
              >
                {alert.actions.primary.label}
              </Button>
            </div>
          </div>

          {/* Subtle glow effect */}
          <div className={`absolute inset-0 pointer-events-none rounded-2xl ${
            isCritical 
              ? 'shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]' 
              : 'alicia-glow'
          }`} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AliciaPreventiveAlert;
