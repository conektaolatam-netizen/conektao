import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadFaceRecognitionModels, extractFaceDescriptor, compareFaces, captureFrameAsBlob, isModelsLoaded } from '@/lib/faceRecognition';
import { supabase } from '@/integrations/supabase/client';

interface FaceVerificationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  storedDescriptor: number[];
  onVerificationSuccess: (confidence: number, photoUrl: string | null) => void;
  onVerificationFailed: () => void;
}

type VerificationStatus = 'loading' | 'ready' | 'verifying' | 'success' | 'failed' | 'error';

const FaceVerification = ({
  isOpen,
  onOpenChange,
  employeeId,
  employeeName,
  storedDescriptor,
  onVerificationSuccess,
  onVerificationFailed
}: FaceVerificationProps) => {
  const { toast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Load models when dialog opens
  useEffect(() => {
    if (!isOpen) {
      setStatus('loading');
      setFaceDetected(false);
      setConfidence(0);
      setAttempts(0);
      return;
    }

    const loadModels = async () => {
      if (isModelsLoaded()) {
        setStatus('ready');
        return;
      }

      setStatus('loading');
      const loaded = await loadFaceRecognitionModels();
      setStatus(loaded ? 'ready' : 'error');
    };

    loadModels();
  }, [isOpen]);

  // Continuous face detection
  useEffect(() => {
    if (!isOpen || status !== 'ready') return;

    const detectFace = async () => {
      if (!webcamRef.current?.video) return;

      const descriptor = await extractFaceDescriptor(webcamRef.current.video);
      setFaceDetected(!!descriptor);
    };

    const interval = setInterval(detectFace, 300);
    return () => clearInterval(interval);
  }, [isOpen, status]);

  const handleVerify = useCallback(async () => {
    if (!webcamRef.current?.video || !faceDetected) {
      toast({
        title: 'No se detecta rostro',
        description: 'Asegúrate de que tu rostro esté visible',
        variant: 'destructive'
      });
      return;
    }

    setStatus('verifying');

    try {
      const video = webcamRef.current.video;
      
      // Extract live face descriptor
      const liveDescriptor = await extractFaceDescriptor(video);
      if (!liveDescriptor) {
        throw new Error('No se pudo detectar el rostro');
      }

      // Compare with stored descriptor
      const result = compareFaces(liveDescriptor, storedDescriptor);
      
      console.log('Face verification result:', result);

      if (result.isMatch) {
        setConfidence(result.confidence);
        setStatus('success');

        // Capture verification photo
        let photoUrl: string | null = null;
        const photoBlob = await captureFrameAsBlob(video);
        if (photoBlob) {
          const fileName = `${employeeId}/verification-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('face-photos')
            .upload(fileName, photoBlob, { contentType: 'image/jpeg' });

          if (!uploadError) {
            const { data } = supabase.storage.from('face-photos').getPublicUrl(fileName);
            photoUrl = data.publicUrl;
          }
        }

        // Delay to show success animation
        setTimeout(() => {
          onVerificationSuccess(result.confidence, photoUrl);
          onOpenChange(false);
        }, 1000);
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts + 1 >= maxAttempts) {
          setStatus('failed');
          toast({
            title: 'Verificación fallida',
            description: `No se pudo verificar tu identidad después de ${maxAttempts} intentos`,
            variant: 'destructive'
          });
          setTimeout(() => {
            onVerificationFailed();
            onOpenChange(false);
          }, 2000);
        } else {
          setStatus('ready');
          toast({
            title: 'Rostro no coincide',
            description: `Intento ${attempts + 1} de ${maxAttempts}. Inténtalo de nuevo.`,
            variant: 'destructive'
          });
        }
      }
    } catch (error: any) {
      console.error('Face verification error:', error);
      setStatus('error');
      toast({
        title: 'Error de verificación',
        description: error.message || 'No se pudo completar la verificación',
        variant: 'destructive'
      });
    }
  }, [employeeId, faceDetected, storedDescriptor, attempts, toast, onVerificationSuccess, onVerificationFailed, onOpenChange]);

  // Auto-verify when face is detected and stable
  useEffect(() => {
    if (status !== 'ready' || !faceDetected) return;

    const autoVerifyTimeout = setTimeout(() => {
      handleVerify();
    }, 1500); // Wait 1.5s after face detection to verify

    return () => clearTimeout(autoVerifyTimeout);
  }, [status, faceDetected, handleVerify]);

  const handleSkip = () => {
    toast({
      title: 'Verificación omitida',
      description: 'El registro se completará sin verificación facial',
    });
    onVerificationFailed();
    onOpenChange(false);
  };

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: 'user'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Verificación Facial
          </DialogTitle>
          <DialogDescription>
            {employeeName}, mira a la cámara para verificar tu identidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Preparando cámara...</p>
            </div>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Error al cargar el sistema de verificación.
                <Button variant="link" size="sm" onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {(status === 'ready' || status === 'verifying') && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored
                />
                
                {/* Detection overlay */}
                <div className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                  status === 'verifying' 
                    ? 'border-blue-500 animate-pulse'
                    : faceDetected 
                      ? 'border-green-500' 
                      : 'border-yellow-500'
                }`}>
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    status === 'verifying'
                      ? 'bg-blue-500 text-white'
                      : faceDetected 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-black'
                  }`}>
                    {status === 'verifying' 
                      ? 'Verificando...'
                      : faceDetected 
                        ? '✓ Rostro detectado' 
                        : 'Buscando rostro...'}
                  </div>
                </div>

                {status === 'verifying' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {faceDetected 
                  ? 'Mantén la posición, verificando automáticamente...'
                  : 'Centra tu rostro en la cámara'}
              </p>

              {attempts > 0 && (
                <p className="text-xs text-center text-orange-500">
                  Intentos restantes: {maxAttempts - attempts}
                </p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
              </div>
              <p className="mt-3 text-lg font-semibold text-green-600">
                ¡Verificado!
              </p>
              <p className="text-sm text-muted-foreground">
                Confianza: {Math.round(confidence * 100)}%
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center py-8">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="mt-3 text-lg font-semibold text-red-600">
                Verificación fallida
              </p>
              <p className="text-sm text-muted-foreground">
                No se pudo confirmar tu identidad
              </p>
            </div>
          )}

          {(status === 'ready' || status === 'verifying') && (
            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={!faceDetected || status === 'verifying'}
                className="flex-1"
              >
                {status === 'verifying' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar ahora
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Omitir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FaceVerification;
