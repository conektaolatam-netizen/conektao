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
  const [isMicMuted, setIsMicMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  // SDK handles muting natively via micMuted prop
  const conversation = useConversation({
    micMuted: isMicMuted,
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
      setStatus('idle');
    },
  });

  // Store conversation in a ref so keepalive never tears down from ref changes
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  // Keepalive: depends ONLY on status, uses ref for conversation
  useEffect(() => {
    if (status === 'connected') {
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
  }, [status]);

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
    setIsMicMuted(false);
    setStatus('idle');
  }, [conversation]);

  const handleClose = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') {
      await endConversation();
    }
    hasStartedRef.current = false;
    onClose();
  }, [status, endConversation, onClose]);

  const toggleMic = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  // Start ONCE when panel opens — never auto-restart
  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startConversation();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Video: play when speaking, pause when listening
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isOpen && status === 'connected' && conversation.isSpeaking) {
      video.play().catch(() => {});
    } else if (isOpen && status === 'connected') {
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
  }, [isOpen, status, conversation.isSpeaking]);

  const statusLabel = {
    idle: 'Desconectada',
    connecting: 'Conectando...',
    connected: conversation.isSpeaking ? 'Hablando...' : (isMicMuted ? 'Micrófono silenciado' : 'Escuchando...'),
    error: 'Error de conexión',
  }[status];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
              style={{
                background: 'linear-gradient(180deg, #3D2914 0%, #2A1A0A 100%)',
                border: '1px solid rgba(212, 184, 150, 0.3)',
              }}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5 text-[#F5E6D3]/80" />
              </button>

              <div className="relative flex flex-col items-center justify-center pt-10 pb-6 px-6">
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: status === 'connected' ? '#00D4AA' : status === 'connecting' ? '#FFB020' : '#666',
                      boxShadow: status === 'connected' ? '0 0 8px #00D4AA' : 'none',
                    }}
                  />
                  <span className="text-[#F5E6D3] text-sm font-medium">ALICIA</span>
                  <span className="text-[#D4B896]/70 text-xs">{statusLabel}</span>
                </div>

                <div
                  className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: conversation.isSpeaking
                      ? '0 0 60px rgba(212, 184, 150, 0.4), 0 0 120px rgba(212, 184, 150, 0.15)'
                      : '0 0 30px rgba(212, 184, 150, 0.2)',
                    transition: 'box-shadow 0.5s ease',
                  }}
                >
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    style={{
                      opacity: status === 'connected' ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      objectPosition: 'center 18%',
                    }}
                  >
                    <source src="/alicia-speaking.mp4" type="video/mp4" />
                  </video>

                  <img
                    src="/alicia-idle.png"
                    alt="ALICIA"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity: status === 'connected' ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                      objectPosition: 'center 18%',
                    }}
                  />

                  {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-10 h-10 text-[#D4B896] animate-spin" />
                    </div>
                  )}
                </div>

                {conversation.isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute w-80 h-80 md:w-[22rem] md:h-[22rem] rounded-full border-2 border-[#D4B896]/30 pointer-events-none"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  />
                )}
              </div>

              <div className="px-6 pb-6 flex flex-col items-center gap-3">
                {status === 'connected' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMic}
                      className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                      style={{
                        background: isMicMuted ? 'rgba(255, 107, 53, 0.2)' : 'rgba(0, 212, 170, 0.15)',
                        border: `1px solid ${isMicMuted ? 'rgba(255, 107, 53, 0.4)' : 'rgba(0, 212, 170, 0.3)'}`,
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
                        background: 'rgba(255, 107, 53, 0.15)',
                        color: '#FF6B35',
                        border: '1px solid rgba(255, 107, 53, 0.3)',
                      }}
                    >
                      Terminar conversación
                    </button>
                  </div>
                )}

                {(status === 'idle' || status === 'error') && isOpen && (
                  <button
                    onClick={startConversation}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(0, 212, 170, 0.15)',
                      color: '#00D4AA',
                      border: '1px solid rgba(0, 212, 170, 0.3)',
                    }}
                  >
                    <Mic className="w-4 h-4" />
                    {status === 'error' ? 'Reintentar' : 'Reconectar'}
                  </button>
                )}

                <p className="text-[#D4B896]/30 text-[10px] text-center">
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
