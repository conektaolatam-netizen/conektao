import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AliciaVoicePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALICIA_AGENT_ID = 'agent_9401kcyypg67eb6v07dnqzds6hwn';

// Coffee-tone wave colors for Crepes & Waffles
const WAVE_COLORS = [
  'rgba(74, 55, 40, 0.6)',    // Dark coffee
  'rgba(92, 64, 51, 0.5)',    // Medium coffee
  'rgba(139, 90, 43, 0.4)',   // Caramel
  'rgba(166, 124, 82, 0.35)', // Light brown
  'rgba(212, 184, 150, 0.3)', // Beige/cream
  'rgba(120, 75, 40, 0.45)',  // Rich brown
];

const AliciaVoicePanel: React.FC<AliciaVoicePanelProps> = ({ isOpen, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const isConnectingRef = useRef(false);

  // micMuted = mutes USER's mic; volume = ALICIA's output (always 1)
  const conversation = useConversation({
    micMuted: isMicMuted,
    volume: 1,
    onConnect: () => {
      console.log('ALICIA connected');
      isConnectingRef.current = false;
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('ALICIA disconnected');
      isConnectingRef.current = false;
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('ALICIA error:', error);
      isConnectingRef.current = false;
      setIsConnecting(false);
    },
  });

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  // Keepalive: depends ONLY on conversation.status (SDK value)
  useEffect(() => {
    if (conversation.status === 'connected') {
      keepaliveRef.current = setInterval(() => {
        try { conversationRef.current.sendUserActivity(); } catch {}
      }, 10000);
    }
    return () => {
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
        keepaliveRef.current = null;
      }
    };
  }, [conversation.status]);

  const startConversation = useCallback(async () => {
    const conv = conversationRef.current;
    if (isConnectingRef.current || conv.status === 'connected') return;
    isConnectingRef.current = true;
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conv.startSession({
        agentId: ALICIA_AGENT_ID,
        connectionType: 'webrtc',
      });
    } catch (err) {
      console.error('Failed to start ALICIA:', err);
      isConnectingRef.current = false;
      setIsConnecting(false);
      toast.error('No se pudo conectar con ALICIA. Verifica el micrófono.');
    }
  }, []);

  const endConversation = useCallback(async () => {
    const conv = conversationRef.current;
    if (conv.status === 'connected') {
      try { await conv.endSession(); } catch {}
    }
    setIsMicMuted(false);
  }, []);

  const handleClose = useCallback(async () => {
    try {
      const conv = conversationRef.current;
      if (conv.status === 'connected') {
        await conv.endSession();
      }
    } catch {}
    isConnectingRef.current = false;
    setIsConnecting(false);
    setIsMicMuted(false);
    hasStartedRef.current = false;
    // Small delay before closing UI to let session cleanup finish
    setTimeout(() => onClose(), 100);
  }, [onClose]);

  const toggleMic = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  // Start conversation every time panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready and previous session is fully cleaned up
      const timer = setTimeout(() => {
        const conv = conversationRef.current;
        if (conv.status === 'disconnected' && !isConnectingRef.current) {
          startConversation();
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Reset refs when panel closes so next open works cleanly
      hasStartedRef.current = false;
      isConnectingRef.current = false;
    }
  }, [isOpen, startConversation]);

  // Video: play when speaking, pause when listening
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isConnected = conversation.status === 'connected';

    if (isOpen && isConnected && conversation.isSpeaking) {
      video.play().catch(() => {});
    } else if (isOpen && isConnected) {
      video.pause();
    } else {
      video.pause();
      video.currentTime = 0;
    }

    const handleEnded = () => {
      if (video && conversation.isSpeaking) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isOpen, conversation.status, conversation.isSpeaking]);

  const isConnected = conversation.status === 'connected';
  const isDisconnected = conversation.status === 'disconnected';

  const statusLabel = isConnecting
    ? 'Conectando...'
    : isConnected
      ? conversation.isSpeaking ? 'Hablando...' : (isMicMuted ? 'Micrófono silenciado' : 'Escuchando...')
      : 'Desconectada';

  const dotColor = isConnected ? '#00D4AA' : isConnecting ? '#FFB020' : '#666';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#3D2914]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(212, 184, 150, 0.4)',
              }}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#4A3728]/10 hover:bg-[#4A3728]/20 transition-colors"
              >
                <X className="w-5 h-5 text-[#4A3728]/70" />
              </button>

              <div className="relative flex flex-col items-center justify-center pt-10 pb-6 px-6">
                {/* Status bar */}
                <div className="flex items-center gap-2 mb-8">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: dotColor,
                      boxShadow: isConnected ? '0 0 8px #00D4AA' : 'none',
                    }}
                  />
                  <span className="text-[#4A3728] text-sm font-semibold tracking-wide">ALICIA</span>
                  <span className="text-[#8B5A2B]/60 text-xs">{statusLabel}</span>
                </div>

                {/* ALICIA circle with animated waves */}
                <div className="relative w-80 h-80 md:w-[22rem] md:h-[22rem] flex items-center justify-center">
                  
                  {/* Animated coffee waves */}
                  {WAVE_COLORS.map((color, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: `${100 + (i + 1) * 8}%`,
                        height: `${100 + (i + 1) * 8}%`,
                        border: `${2 - i * 0.15}px solid ${color}`,
                        background: `radial-gradient(circle, transparent 60%, ${color.replace(/[\d.]+\)$/, '0.05)')})`,
                      }}
                      animate={{
                        scale: conversation.isSpeaking 
                          ? [1, 1.03 + i * 0.008, 1, 0.97 - i * 0.005, 1]
                          : [1, 1.01 + i * 0.003, 1],
                        rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                        opacity: conversation.isSpeaking
                          ? [0.4 + i * 0.08, 0.8 - i * 0.05, 0.4 + i * 0.08]
                          : [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: conversation.isSpeaking ? 3 + i * 0.7 : 8 + i * 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}

                  {/* Pulsing glow behind circle when speaking */}
                  {conversation.isSpeaking && (
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: '95%',
                        height: '95%',
                        background: 'radial-gradient(circle, rgba(139, 90, 43, 0.15) 0%, transparent 70%)',
                      }}
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* ALICIA avatar circle */}
                  <div
                    className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden z-10"
                    style={{
                      boxShadow: conversation.isSpeaking
                        ? '0 0 40px rgba(139, 90, 43, 0.3), 0 0 80px rgba(139, 90, 43, 0.1)'
                        : '0 0 20px rgba(74, 55, 40, 0.15)',
                      transition: 'box-shadow 0.5s ease',
                      border: '3px solid rgba(212, 184, 150, 0.5)',
                    }}
                  >
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                      muted
                      style={{
                        opacity: isConnected ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        backgroundColor: 'white',
                      }}
                    >
                      <source src="/alicia-speaking.mov" type="video/quicktime" />
                      <source src="/alicia-speaking.mov" type="video/mp4" />
                    </video>

                    <img
                      src="/alicia-idle.png"
                      alt="ALICIA"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        opacity: isConnected ? 0 : 1,
                        transition: 'opacity 0.3s ease',
                        backgroundColor: 'white',
                      }}
                    />

                    {isConnecting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Loader2 className="w-10 h-10 text-[#8B5A2B] animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 pb-6 flex flex-col items-center gap-3">
                {isConnected && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMic}
                      className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                      style={{
                        background: isMicMuted ? 'rgba(255, 107, 53, 0.12)' : 'rgba(0, 212, 170, 0.1)',
                        border: `1.5px solid ${isMicMuted ? 'rgba(255, 107, 53, 0.35)' : 'rgba(0, 212, 170, 0.25)'}`,
                      }}
                      title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                    >
                      {isMicMuted ? (
                        <MicOff className="w-5 h-5 text-[#FF6B35]" />
                      ) : (
                        <Mic className="w-5 h-5 text-[#00D4AA]" />
                      )}
                    </button>

                    <button
                      onClick={endConversation}
                      className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: 'rgba(74, 55, 40, 0.08)',
                        color: '#4A3728',
                        border: '1px solid rgba(74, 55, 40, 0.2)',
                      }}
                    >
                      Terminar conversación
                    </button>
                  </div>
                )}

                {isDisconnected && !isConnecting && isOpen && hasStartedRef.current && (
                  <button
                    onClick={startConversation}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(0, 212, 170, 0.1)',
                      color: '#00D4AA',
                      border: '1px solid rgba(0, 212, 170, 0.3)',
                    }}
                  >
                    <Mic className="w-4 h-4" />
                    Reconectar
                  </button>
                )}

                <p className="text-[#8B5A2B]/30 text-[10px] text-center">
                  Powered by Conektao AI × ElevenLabs
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AliciaVoicePanel;
