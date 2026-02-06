import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import AliciaVoicePanel from './AliciaVoicePanel';

const AliciaVoiceButton: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      {!isPanelOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative">
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity blur-sm"
              style={{ background: 'linear-gradient(135deg, #00D4AA, #FF6B35)' }}
            />
            {/* Button */}
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)',
                border: '1.5px solid rgba(0, 212, 170, 0.5)',
              }}
            >
              <Mic className="w-5 h-5 text-[#00D4AA]" />
            </div>
            {/* Pulse */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -inset-1 rounded-full border border-[#00D4AA]/30"
            />
          </div>
          {/* Label */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/70 bg-black/70 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Hablar con ALICIA
          </span>
        </motion.button>
      )}

      {/* Voice panel */}
      <AliciaVoicePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};

export default AliciaVoiceButton;
