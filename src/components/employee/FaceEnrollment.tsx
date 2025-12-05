import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CheckCircle, AlertCircle, UserCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadFaceRecognitionModels, extractFaceDescriptor, captureFrameAsBlob, isModelsLoaded } from '@/lib/faceRecognition';

interface FaceEnrollmentProps {
  employeeId: string;
  employeeName: string;
  currentFacePhotoUrl?: string | null;
  onEnrollmentComplete?: () => void;
}

const FaceEnrollment = ({ employeeId, employeeName, currentFacePhotoUrl, onEnrollmentComplete }: FaceEnrollmentProps) => {
  const { toast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      if (isModelsLoaded()) {
        setModelsReady(true);
        return;
      }
      
      setLoadingModels(true);
      const loaded = await loadFaceRecognitionModels();
      setModelsReady(loaded);
      setLoadingModels(false);
    };
    
    loadModels();
  }, []);

  // Continuous face detection while camera is active
  useEffect(() => {
    if (!cameraActive || !modelsReady) return;
    
    const detectFace = async () => {
      if (!webcamRef.current?.video) return;
      
      const { extractFaceDescriptor } = await import('@/lib/faceRecognition');
      const descriptor = await extractFaceDescriptor(webcamRef.current.video);
      setFaceDetected(!!descriptor);
    };
    
    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [cameraActive, modelsReady]);

  const handleStartCamera = () => {
    setCameraActive(true);
  };

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current?.video || !faceDetected) {
      toast({
        title: 'No se detecta rostro',
        description: 'Asegúrate de que tu rostro esté visible en la cámara',
        variant: 'destructive'
      });
      return;
    }

    setEnrolling(true);

    try {
      const video = webcamRef.current.video;
      
      // Extract face descriptor
      const descriptor = await extractFaceDescriptor(video);
      if (!descriptor) {
        throw new Error('No se pudo extraer el descriptor facial');
      }

      // Capture photo as blob
      const photoBlob = await captureFrameAsBlob(video);
      if (!photoBlob) {
        throw new Error('No se pudo capturar la imagen');
      }

      // Upload photo to storage
      const fileName = `${employeeId}/face-reference-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('face-photos')
        .upload(fileName, photoBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('face-photos')
        .getPublicUrl(fileName);

      // Update profile with face data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          face_descriptor: Array.from(descriptor),
          face_photo_url: urlData.publicUrl,
          face_enrolled_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      toast({
        title: 'Rostro registrado',
        description: `El reconocimiento facial de ${employeeName} ha sido configurado correctamente`
      });

      setCameraActive(false);
      onEnrollmentComplete?.();
    } catch (error: any) {
      console.error('Error enrolling face:', error);
      toast({
        title: 'Error al registrar rostro',
        description: error.message || 'No se pudo completar el registro facial',
        variant: 'destructive'
      });
    } finally {
      setEnrolling(false);
    }
  }, [employeeId, employeeName, faceDetected, toast, onEnrollmentComplete]);

  const handleDeleteFaceData = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          face_descriptor: null,
          face_photo_url: null,
          face_enrolled_at: null
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: 'Datos faciales eliminados',
        description: `Se eliminó el registro facial de ${employeeName}`
      });

      onEnrollmentComplete?.();
    } catch (error: any) {
      console.error('Error deleting face data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los datos faciales',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5" />
          Reconocimiento Facial
        </CardTitle>
        <CardDescription>
          Registra el rostro del empleado para verificación de entrada/salida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingModels && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Cargando modelos de reconocimiento facial...
            </AlertDescription>
          </Alert>
        )}

        {!loadingModels && !modelsReady && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar los modelos de reconocimiento facial.
              Verifica tu conexión a internet.
            </AlertDescription>
          </Alert>
        )}

        {currentFacePhotoUrl && !cameraActive && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Rostro registrado
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  El empleado puede usar verificación facial
                </p>
              </div>
              <img 
                src={currentFacePhotoUrl} 
                alt="Face reference" 
                className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartCamera}
                disabled={!modelsReady}
              >
                <Camera className="h-4 w-4 mr-2" />
                Actualizar foto
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteFaceData}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            </div>
          </div>
        )}

        {!currentFacePhotoUrl && !cameraActive && modelsReady && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              No hay rostro registrado para este empleado
            </p>
            <Button onClick={handleStartCamera}>
              <Camera className="h-4 w-4 mr-2" />
              Registrar rostro
            </Button>
          </div>
        )}

        {cameraActive && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                videoConstraints={videoConstraints}
                className="w-full"
                mirrored
              />
              
              {/* Face detection overlay */}
              <div className={`absolute inset-0 border-4 rounded-lg transition-colors ${
                faceDetected ? 'border-green-500' : 'border-yellow-500'
              }`}>
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                  faceDetected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-500 text-black'
                }`}>
                  {faceDetected ? '✓ Rostro detectado' : 'Buscando rostro...'}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCapture}
                disabled={!faceDetected || enrolling}
                className="flex-1"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Capturar y guardar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCameraActive(false)}
                disabled={enrolling}
              >
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Asegúrate de tener buena iluminación y mirar directamente a la cámara
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceEnrollment;
