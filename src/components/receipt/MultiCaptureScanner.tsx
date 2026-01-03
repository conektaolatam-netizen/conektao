import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  CheckCircle, 
  ChevronRight, 
  X, 
  AlertTriangle,
  FileImage,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { generateHash } from '@/lib/receiptValidation';
import { enhanceReceiptImage } from '@/lib/imageEnhancement';

interface CapturedSection {
  id: string;
  type: 'header' | 'items' | 'footer';
  imageBase64: string;
  hash: string;
  capturedAt: string;
}

interface MultiCaptureScannerProps {
  onComplete: (captures: CapturedSection[], mergedImage: string) => void;
  onCancel: () => void;
  restrictToCamera?: boolean; // Para cajeros: solo cámara
}

const SECTION_CONFIG = {
  header: {
    label: 'Encabezado',
    description: 'Proveedor, NIT, fecha',
    icon: '📋',
    order: 1
  },
  items: {
    label: 'Productos',
    description: 'Lista de items y cantidades',
    icon: '📦',
    order: 2
  },
  footer: {
    label: 'Totales',
    description: 'Subtotal, IVA, total',
    icon: '💰',
    order: 3
  }
};

export const MultiCaptureScanner: React.FC<MultiCaptureScannerProps> = ({
  onComplete,
  onCancel,
  restrictToCamera = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [captures, setCaptures] = useState<CapturedSection[]>([]);
  const [currentSection, setCurrentSection] = useState<'header' | 'items' | 'footer'>('header');
  const [isProcessing, setIsProcessing] = useState(false);

  const progress = (captures.length / 3) * 100;

  /**
   * Process image with automatic enhancement pipeline
   * Applies: document detection, auto-crop, deskew, contrast, sharpening
   */
  const processImage = async (file: File): Promise<{ base64: string; hash: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        // Initial load at reasonable size
        const maxWidth = 1600;
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const rawBase64 = canvas.toDataURL('image/jpeg', 0.9);
        
        try {
          // Apply automatic enhancement (document detection, crop, deskew, contrast, sharpen)
          console.log('🖼️ [MultiCapture] Applying automatic enhancement...');
          const enhanced = await enhanceReceiptImage(rawBase64);
          
          console.log('✅ [MultiCapture] Enhanced:', {
            corrections: enhanced.appliedCorrections,
            size: `${enhanced.finalWidth}x${enhanced.finalHeight}`
          });
          
          const hash = await generateHash(enhanced.base64);
          resolve({ base64: enhanced.base64, hash });
        } catch (enhanceError) {
          console.warn('⚠️ [MultiCapture] Enhancement failed, using raw:', enhanceError);
          const hash = await generateHash(rawBase64);
          resolve({ base64: rawBase64, hash });
        }
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const { base64, hash } = await processImage(file);

      const newCapture: CapturedSection = {
        id: crypto.randomUUID(),
        type: currentSection,
        imageBase64: base64,
        hash,
        capturedAt: new Date().toISOString()
      };

      setCaptures(prev => [...prev, newCapture]);

      // Move to next section
      if (currentSection === 'header') {
        setCurrentSection('items');
        toast({ title: '✅ Encabezado capturado', description: 'Ahora captura los productos' });
      } else if (currentSection === 'items') {
        setCurrentSection('footer');
        toast({ title: '✅ Productos capturados', description: 'Por último, captura los totales' });
      } else {
        // All sections complete - merge and proceed
        toast({ title: '✅ Factura completa', description: 'Procesando...' });
        
        const allCaptures = [...captures, newCapture];
        const mergedImage = await mergeImages(allCaptures);
        onComplete(allCaptures, mergedImage);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      toast({ title: 'Error', description: 'No se pudo procesar la imagen', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      // Reset input
      if (event.target) event.target.value = '';
    }
  };

  const mergeImages = async (allCaptures: CapturedSection[]): Promise<string> => {
    // Sort captures by section order
    const sorted = allCaptures.sort((a, b) => 
      SECTION_CONFIG[a.type].order - SECTION_CONFIG[b.type].order
    );

    // Load all images
    const loadImage = (base64: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64;
      });
    };

    const images = await Promise.all(sorted.map(c => loadImage(c.imageBase64)));
    
    // Calculate total height
    const maxWidth = Math.max(...images.map(img => img.width));
    const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

    // Create merged canvas
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Cannot create canvas context');

    // Draw all images vertically
    let yOffset = 0;
    for (const img of images) {
      ctx.drawImage(img, 0, yOffset);
      yOffset += img.height;
    }

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const removeCapture = (id: string) => {
    const removed = captures.find(c => c.id === id);
    setCaptures(prev => prev.filter(c => c.id !== id));
    
    // Reset to the removed section
    if (removed) {
      setCurrentSection(removed.type);
    }
  };

  const sectionInfo = SECTION_CONFIG[currentSection];
  const isSectionCaptured = (type: 'header' | 'items' | 'footer') => 
    captures.some(c => c.type === type);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Escaneo guiado de factura
        </CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status of all sections */}
        <div className="grid grid-cols-3 gap-2">
          {(['header', 'items', 'footer'] as const).map((section) => {
            const config = SECTION_CONFIG[section];
            const captured = isSectionCaptured(section);
            const isCurrent = currentSection === section && !captured;
            
            return (
              <div 
                key={section}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  captured 
                    ? 'border-green-500 bg-green-50' 
                    : isCurrent 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-muted bg-muted/30'
                }`}
              >
                <span className="text-2xl mb-1 block">{config.icon}</span>
                <span className="text-xs font-medium">{config.label}</span>
                {captured && <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Current section instructions */}
        {!captures.some(c => c.type === currentSection) && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{sectionInfo.icon}</span>
              <div>
                <p className="font-medium">{sectionInfo.label}</p>
                <p className="text-sm text-muted-foreground">{sectionInfo.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => cameraInputRef.current?.click()} 
                disabled={isProcessing}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                📸 Fotografiar
              </Button>
              
              {!restrictToCamera && (
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Subir imagen
                </Button>
              )}
            </div>

            {restrictToCamera && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Solo captura con cámara disponible (política de seguridad)
              </p>
            )}
          </div>
        )}

        {/* Captured sections preview */}
        {captures.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Capturas realizadas:</p>
            {captures.map((capture) => (
              <div key={capture.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <img 
                  src={capture.imageBase64} 
                  alt={SECTION_CONFIG[capture.type].label}
                  className="w-16 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{SECTION_CONFIG[capture.type].label}</p>
                  <p className="text-xs text-muted-foreground">
                    Hash: {capture.hash.substring(0, 12)}...
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeCapture(capture.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Single capture mode notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            ¿Factura pequeña que cabe en una foto? 
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 ml-1"
              onClick={() => {
                // Skip multi-capture, use single
                cameraInputRef.current?.click();
              }}
            >
              Captura única aquí
            </Button>
          </span>
        </div>

        {/* Cancel button */}
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancelar
        </Button>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handleCapture}
          className="sr-only"
          capture="environment"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCapture}
          className="sr-only"
        />
      </CardContent>
    </Card>
  );
};
