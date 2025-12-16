import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ExtractedMenuData } from './MenuOnboardingFlow';

interface MenuOnboardingUploadProps {
  onComplete: (data: ExtractedMenuData) => void;
  onBack: () => void;
}

export function MenuOnboardingUpload({ onComplete, onBack }: MenuOnboardingUploadProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.warning('Algunos archivos no son imágenes válidas');
    }

    // Create previews
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (!user || images.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Subiendo imágenes...');

    try {
      // Upload images to storage
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileName = `${user.id}/${Date.now()}-${i}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-imports')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading:', uploadError);
          throw new Error(`Error al subir imagen ${i + 1}`);
        }

        const { data: urlData } = supabase.storage
          .from('menu-imports')
          .getPublicUrl(uploadData.path);

        uploadedUrls.push(urlData.publicUrl);
        setProgress(10 + (30 * (i + 1) / images.length));
      }

      setStatusMessage('Analizando menú con IA...');
      setProgress(50);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('menu-onboarding-parse', {
        body: { imageUrls: uploadedUrls }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error al procesar menú');

      setProgress(90);
      setStatusMessage('Preparando resultados...');

      // Save session to DB
      const { error: sessionError } = await supabase
        .from('menu_import_sessions')
        .insert({
          user_id: user.id,
          restaurant_id: null, // Will be set if user has restaurant
          status: 'review',
          original_images: uploadedUrls,
          extracted_data: data.data,
        });

      if (sessionError) {
        console.error('Error saving session:', sessionError);
      }

      setProgress(100);
      toast.success(`¡Menú procesado! ${data.data.metadata.total_items} productos encontrados`);
      
      onComplete(data.data);

    } catch (error) {
      console.error('Error processing menu:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el menú');
      setIsProcessing(false);
      setProgress(0);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} disabled={isProcessing}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <CardTitle>Sube las fotos de tu menú</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Upload area */}
            {!isProcessing && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Haz clic o arrastra tus imágenes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG • Múltiples páginas permitidas
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Image previews */}
                <AnimatePresence>
                  {previews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-3 gap-3"
                    >
                      {previews.map((preview, index) => (
                        <motion.div
                          key={preview}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={preview}
                            alt={`Página ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                            <Image className="w-3 h-3 inline mr-1" />
                            {index + 1}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Agregar más
                  </Button>
                  <Button
                    onClick={processImages}
                    disabled={images.length === 0}
                    className="flex-1 bg-gradient-to-r from-primary to-orange-500"
                  >
                    Analizar menú
                  </Button>
                </div>
              </>
            )}

            {/* Processing state */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-center">{statusMessage}</p>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Esto puede tomar unos segundos...
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
