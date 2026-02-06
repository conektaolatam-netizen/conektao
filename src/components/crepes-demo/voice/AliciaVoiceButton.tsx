import React, { useState } from 'react';
import AliciaVoicePanel from './AliciaVoicePanel';

const AliciaVoiceButton: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      {/* Static circular avatar button - top right */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed top-4 right-4 z-50 group"
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4B896]/50 shadow-lg hover:border-[#D4B896] transition-all duration-300">
            <img
              src="/alicia-idle.png"
              alt="Hablar con ALICIA"
              className="w-full h-full object-cover object-top"
            />
          </div>
          {/* Tooltip */}
          <span className="absolute top-full mt-1 right-0 whitespace-nowrap text-[10px] text-[#F5E6D3] bg-[#5C4033]/90 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Hablar con ALICIA
          </span>
        </button>
      )}

      {/* Voice panel */}
      <AliciaVoicePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};

export default AliciaVoiceButton;
