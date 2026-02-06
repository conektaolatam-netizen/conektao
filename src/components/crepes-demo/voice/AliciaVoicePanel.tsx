import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AliciaVoicePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AliciaVoicePanel: React.FC<AliciaVoicePanelProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('ALICIA connected');
      setStatus('connected');
    },
    onDisconnect: () => {
      console.log('ALICIA disconnected');
      setStatus('idle');
    },
    onError: (error) => {
      console.error('ALICIA error:', error);
      setStatus('error');
      toast.error('Error de conexión con ALICIA');
    },
  });

  const startConversation = useCallback(async () => {
    if (status === 'connecting' || status === 'connected') return;
    setStatus('connecting');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: 'agent_9401kcyypg67eb6v07dnqzds6hwn',
        connectionType: 'webrtc',
      });
    } catch (err) {
      console.error('Failed to start ALICIA:', err);
      setStatus('error');
      toast.error('No se pudo conectar con ALICIA. Verifica el micrófono.');
    }
  }, [conversation, status]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    setStatus('idle');
  }, [conversation]);

  const handleClose = useCallback(async () => {
    if (status === 'connected') {
      await endConversation();
    }
    onClose();
  }, [status, endConversation, onClose]);

  // Auto-start on open
  useEffect(() => {
    if (isOpen && status === 'idle') {
      startConversation();
    }
  }, [isOpen]);

  // Control video playback based on speaking state
  useEffect(() => {
    if (videoRef.current) {
      if (conversation.isSpeaking) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [conversation.isSpeaking]);

  const statusLabel = {
    idle: 'Desconectada',
    connecting: 'Conectando...',
    connected: conversation.isSpeaking ? 'Hablando...' : 'Escuchando...',
    error: 'Error de conexión',
  }[status];

  const statusColor = {
    idle: 'text-gray-400',
    connecting: 'text-amber-400',
    connected: conversation.isSpeaking ? 'text-[#00D4AA]' : 'text-[#FF6B35]',
    error: 'text-red-400',
  }[status];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-24 right-6 z-50 w-[360px] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: status === 'connected' ? '#00D4AA' : status === 'connecting' ? '#FFB020' : '#666',
                  boxShadow: status === 'connected' ? '0 0 8px #00D4AA' : 'none',
                }}
              />
              <span className="text-white/90 text-sm font-medium">ALICIA</span>
              <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Avatar area */}
          <div className="relative flex items-center justify-center py-8 px-4">
            <div className="relative w-48 h-48 rounded-full overflow-hidden" style={{
              boxShadow: conversation.isSpeaking
                ? '0 0 40px rgba(0, 212, 170, 0.4), 0 0 80px rgba(0, 212, 170, 0.15)'
                : '0 0 20px rgba(255, 107, 53, 0.2)',
              transition: 'box-shadow 0.5s ease',
            }}>
              {/* Video for speaking */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                muted={false}
                style={{
                  opacity: conversation.isSpeaking ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {/* User will upload video - placeholder source */}
                <source src="/alicia-speaking.mp4" type="video/mp4" />
              </video>

              {/* Static image for listening */}
              <img
                src="/alicia-idle.png"
                alt="ALICIA"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: conversation.isSpeaking ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              />

              {/* Connecting overlay */}
              {status === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 text-[#00D4AA] animate-spin" />
                </div>
              )}
            </div>

            {/* Pulse ring when speaking */}
            {conversation.isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-52 h-52 rounded-full border-2 border-[#00D4AA]/30"
              />
            )}
          </div>

          {/* Bottom controls */}
          <div className="px-4 pb-4 flex flex-col items-center gap-3">
            {status === 'connected' && (
              <button
                onClick={endConversation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255, 107, 53, 0.15)',
                  color: '#FF6B35',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                }}
              >
                <MicOff className="w-4 h-4" />
                Terminar conversación
              </button>
            )}

            {status === 'error' && (
              <button
                onClick={startConversation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: 'rgba(0, 212, 170, 0.15)',
                  color: '#00D4AA',
                  border: '1px solid rgba(0, 212, 170, 0.3)',
                }}
              >
                <Mic className="w-4 h-4" />
                Reintentar
              </button>
            )}

            <p className="text-white/30 text-[10px] text-center">
              Powered by Conektao AI × ElevenLabs
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AliciaVoicePanel;
