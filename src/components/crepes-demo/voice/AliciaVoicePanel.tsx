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

const AliciaVoicePanel: React.FC<AliciaVoicePanelProps> = ({ isOpen, onClose }) => {
  // Only local state: connecting flag + mic mute. Everything else comes from SDK.
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const isConnectingRef = useRef(false); // lock to prevent overlapping startSession

  const conversation = useConversation({
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

  // Stable ref for keepalive — never causes effect re-runs
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

  // Mute: toggle SDK's setMicMuted when isMicMuted changes
  useEffect(() => {
    if (conversation.status === 'connected') {
      try { conversationRef.current.setVolume({ volume: isMicMuted ? 0 : 1 }); } catch {}
    }
  }, [isMicMuted, conversation.status]);

  const startConversation = useCallback(async () => {
    // Guard: prevent overlapping calls
    if (isConnectingRef.current || conversation.status === 'connected') return;
    isConnectingRef.current = true;
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: ALICIA_AGENT_ID,
        connectionType: 'webrtc',
      });
    } catch (err) {
      console.error('Failed to start ALICIA:', err);
      isConnectingRef.current = false;
      setIsConnecting(false);
      toast.error('No se pudo conectar con ALICIA. Verifica el micrófono.');
    }
    // Note: on success, onConnect callback handles clearing the lock
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const endConversation = useCallback(async () => {
    // ONLY end if truly connected — never during connecting
    if (conversation.status === 'connected') {
      try { await conversation.endSession(); } catch {}
    }
    setIsMicMuted(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(async () => {
    // If connecting, just close the panel — don't call endSession mid-handshake
    if (conversationRef.current.status === 'connected') {
      try { await conversationRef.current.endSession(); } catch {}
    }
    isConnectingRef.current = false;
    setIsConnecting(false);
    setIsMicMuted(false);
    hasStartedRef.current = false;
    onClose();
  }, [onClose]);

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

  // Derive display status from SDK + local connecting flag
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
                      backgroundColor: dotColor,
                      boxShadow: isConnected ? '0 0 8px #00D4AA' : 'none',
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
                      opacity: isConnected ? 1 : 0,
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
                      opacity: isConnected ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                      objectPosition: 'center 18%',
                    }}
                  />

                  {isConnecting && (
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
                {isConnected && (
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

                {isDisconnected && !isConnecting && isOpen && hasStartedRef.current && (
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
                    Reconectar
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
