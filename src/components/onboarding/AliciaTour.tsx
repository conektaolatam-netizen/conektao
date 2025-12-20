import React, { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, SkipForward, ArrowRight, Mic, MicOff, Volume2 } from 'lucide-react';
import AliciaAvatar from './AliciaAvatar';
import TourHighlight from './TourHighlight';
import TourSubtitles from './TourSubtitles';
import { tourSteps } from './tourSteps';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AliciaTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const AliciaTour: React.FC<AliciaTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const { updateTourStep } = useOnboardingTour();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to AliciIA');
      setIsConnecting(false);
      setIsVoiceEnabled(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from AliciIA');
      setIsVoiceEnabled(false);
    },
    onMessage: (message) => {
      console.log('Message from AliciIA:', message);
      // Actualizar subtítulos con la respuesta del agente
      const msg = message as { type?: string; agent_response_event?: { agent_response?: string } };
      if (msg.type === 'agent_response' && msg.agent_response_event?.agent_response) {
        setCurrentSubtitle(msg.agent_response_event.agent_response);
      }
    },
    onError: (error) => {
      console.error('AliciIA error:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con AliciIA. Continuando en modo texto.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    },
  });

  const currentTourStep = tourSteps[currentStep];

  // Iniciar conversación con ElevenLabs
  const startVoiceConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Solicitar permiso de micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Obtener token del edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');

      if (error || !data?.token) {
        console.error('Error getting token:', error);
        throw new Error('No se pudo obtener el token de conversación');
      }

      // Iniciar sesión con WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setIsConnecting(false);
      // Continuar en modo solo texto
      setCurrentSubtitle(currentTourStep.description);
    }
  }, [conversation, currentTourStep]);

  // Actualizar subtítulo cuando cambia el paso
  useEffect(() => {
    setCurrentSubtitle(currentTourStep.description);
    updateTourStep(currentStep);
  }, [currentStep, currentTourStep.description, updateTourStep]);

  // Ir al siguiente paso
  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      conversation.endSession();
      onComplete();
    }
  }, [currentStep, conversation, onComplete]);

  // Saltar tour
  const handleSkip = useCallback(() => {
    conversation.endSession();
    onSkip();
  }, [conversation, onSkip]);

  // Alternar voz
  const toggleVoice = useCallback(async () => {
    if (isVoiceEnabled) {
      await conversation.endSession();
    } else {
      await startVoiceConversation();
    }
  }, [isVoiceEnabled, conversation, startVoiceConversation]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Highlight del elemento actual */}
        <TourHighlight
          targetSelector={currentTourStep.targetSelector}
          isActive={!!currentTourStep.targetSelector}
        />

        {/* Overlay para pasos sin target */}
        {!currentTourStep.targetSelector && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        )}

        {/* Panel principal de AliciIA */}
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header con avatar y controles */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <AliciaAvatar
                  isSpeaking={conversation.isSpeaking}
                  isListening={!conversation.isSpeaking && isVoiceEnabled}
                  size="sm"
                />
                <div>
                  <h3 className="font-semibold text-foreground">AliciIA</h3>
                  <p className="text-xs text-muted-foreground">
                    {isVoiceEnabled 
                      ? conversation.isSpeaking 
                        ? 'Hablando...' 
                        : 'Escuchando...'
                      : 'Modo texto'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  disabled={isConnecting}
                  className="h-8 w-8"
                >
                  {isVoiceEnabled ? (
                    <Volume2 className="h-4 w-4 text-primary" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenido del paso */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Paso {currentStep + 1} de {tourSteps.length}
                </span>
                <span className="text-xs font-medium text-primary">
                  {currentTourStep.title}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-muted rounded-full mb-4">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>

              {/* Descripción */}
              <p className="text-sm text-foreground mb-4 leading-relaxed">
                {currentSubtitle || currentTourStep.description}
              </p>

              {/* Botones de navegación */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Saltar tour
                </Button>
                <Button
                  onClick={nextStep}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subtítulos grandes (solo cuando hay voz) */}
        {isVoiceEnabled && (
          <TourSubtitles
            text={currentSubtitle}
            isVisible={conversation.isSpeaking}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AliciaTour;
