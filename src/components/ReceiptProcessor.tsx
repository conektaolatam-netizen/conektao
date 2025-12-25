import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  Bot, 
  Loader2,
  AlertTriangle,
  FileQuestion,
  RotateCcw,
  ScanLine
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ManualReceiptForm } from '@/components/receipt/ManualReceiptForm';
import { AssistedReceiptReview } from '@/components/receipt/AssistedReceiptReview';
import { ReceiptBlockedState } from '@/components/receipt/ReceiptBlockedState';
import { MultiCaptureScanner } from '@/components/receipt/MultiCaptureScanner';
import { 
  validateReceipt, 
  calculateRealConfidence,
  type ValidationResult,
  type ConfidenceBreakdown,
  type ReceiptState
} from '@/lib/receiptValidation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';

interface ReceiptProcessorProps {
  onProcessComplete?: (data: any) => void;
}

type ProcessingMode = 'idle' | 'multi_capture' | 'processing' | 'blocked' | 'assisted' | 'manual';

const ReceiptProcessor: React.FC<ReceiptProcessorProps> = ({ onProcessComplete }) => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<ProcessingMode>('idle');
  const [receiptState, setReceiptState] = useState<ReceiptState>('uploaded');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [confidenceBreakdown, setConfidenceBreakdown] = useState<ConfidenceBreakdown | null>(null);
  const [fallbackReason, setFallbackReason] = useState<'low_confidence' | 'handwritten' | 'user_requested' | 'ai_error'>('user_requested');
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [captureHashes, setCaptureHashes] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Restringir upload de archivos para cajeros (employee role)
  const isCashierOnly = profile?.role === 'employee';

  const resizeImage = (file: File, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const processReceipt = async (imageBase64: string, sourceType: 'camera' | 'upload' | 'multi_capture' = 'camera') => {
    setMode('processing');
    setReceiptState('uploaded');
    setExtractedData(null);
    setValidation(null);
    setConfidenceBreakdown(null);
    
    try {
      if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
        setMode('idle');
        return;
      }

      // Upload original image
      const blob = await fetch(imageBase64).then(r => r.blob());
      const path = `receipts/${user.id}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('receipts').upload(path, blob, { contentType: 'image/jpeg' });

      let publicUrl: string | null = null;
      if (!uploadErr) {
        const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(path);
        publicUrl = publicData.publicUrl;
        setReceiptUrl(publicUrl);
      }

      // Resize for AI processing
      const resizedImage = imageBase64;

      // Call AI processor
      const { data, error } = await supabase.functions.invoke('receipt-processor', {
        body: { 
          imageBase64: resizedImage, 
          userId: user.id, 
          receiptUrl: publicUrl,
          sourceType, // Track if from camera or upload
          captureHashes // For multi-capture fraud detection
        }
      });

      if (error) throw error;

      setReceiptState('extracted');

      // === VALIDACIÓN REAL OBLIGATORIA ===
      const extractedDataWithDefaults = {
        ...data.data,
        items: data.data?.items || [],
        total: data.data?.total || 0,
        supplier_name: data.data?.supplier_name || ''
      };

      const validationResult = validateReceipt(extractedDataWithDefaults);
      const breakdown = calculateRealConfidence(extractedDataWithDefaults);
      
      setValidation(validationResult);
      setConfidenceBreakdown(breakdown);

      // Guardar confianza REAL, no la reportada por IA
      extractedDataWithDefaults.realConfidence = breakdown.weighted;
      extractedDataWithDefaults.aiReportedConfidence = data.confidence || data.data?.confidence;
      extractedDataWithDefaults.validationStatus = validationResult.status;

      // === DECISIÓN BASADA EN VALIDACIÓN REAL ===
      if (!validationResult.canProceed) {
        // BLOCKED: Datos críticos faltantes
        setExtractedData(extractedDataWithDefaults);
        setFallbackReason('ai_error'); // Use existing type for validation failures
        setReceiptState('blocked');
        setMode('blocked');
        
        // Log evento de auditoría
        console.warn('Receipt BLOCKED:', validationResult.blockingReason);
        
      } else if (validationResult.status === 'needs_review' || breakdown.weighted < 70) {
        // NEEDS REVIEW: Requiere revisión humana
        setExtractedData(extractedDataWithDefaults);
        setReceiptState('needs_review');
        setMode('assisted');
        toast({ 
          title: "⚠️ Revisión requerida", 
          description: `Confianza: ${breakdown.weighted}%. Verifica los datos.` 
        });
        
      } else {
        // VALID: Puede proceder pero siempre requiere confirmación
        setExtractedData(extractedDataWithDefaults);
        setReceiptState('pending_confirmation');
        setMode('assisted');
        toast({ 
          title: "✅ Factura procesada", 
          description: `Confianza: ${breakdown.weighted}%. Confirma los datos.` 
        });
      }

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      
      if (error.status === 429) {
        toast({ title: "Sistema ocupado", description: "Intenta de nuevo en unos segundos", variant: "destructive" });
      } else if (error.status === 402) {
        toast({ title: "Servicio no disponible", description: "Contacta soporte", variant: "destructive" });
      } else {
        toast({ 
          title: "Error al procesar", 
          description: "Puedes usar el modo manual", 
          variant: "destructive" 
        });
      }
      
      setFallbackReason('ai_error');
      setMode('manual');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: "Máximo 5MB", variant: "destructive" });
        return;
      }
      
      const imageBase64 = await resizeImage(file, 1024);
      processReceipt(imageBase64, 'upload');
    }
  };

  const handleMultiCaptureComplete = async (captures: any[], mergedImage: string) => {
    setCaptureHashes(captures.map(c => c.hash));
    await processReceipt(mergedImage, 'multi_capture');
  };

  const handleComplete = (result: any) => {
    onProcessComplete?.(result);
    resetState();
  };

  const resetState = () => {
    setMode('idle');
    setReceiptState('uploaded');
    setExtractedData(null);
    setReceiptUrl(null);
    setValidation(null);
    setConfidenceBreakdown(null);
    setCaptureHashes([]);
  };

  const handleSwitchToManual = () => {
    setFallbackReason('user_requested');
    setMode('manual');
  };

  // IDLE STATE - Initial upload screen
  if (mode === 'idle') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Procesador de Facturas con IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <ScanLine className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Escanear Factura de Proveedor</h3>
              <p className="text-muted-foreground text-sm">
                La IA extraerá proveedor, productos, cantidades y precios automáticamente
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              {/* Multi-capture for long receipts */}
              <Button 
                onClick={() => setMode('multi_capture')} 
                className="h-12"
                variant="default"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                📋 Escanear factura (guiado)
              </Button>
              
              {/* Quick single capture */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => cameraInputRef.current?.click()} 
                  variant="outline" 
                  className="h-10"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  📸 Foto rápida
                </Button>
                
                {/* Solo admin/owner pueden subir archivos */}
                {!isCashierOnly ? (
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="h-10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    📁 Subir
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    disabled 
                    className="h-10 opacity-50"
                    title="Solo cámara disponible para cajeros"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    📁 Subir
                  </Button>
                )}
              </div>
            </div>

            {isCashierOnly && (
              <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Política de seguridad: Solo captura con cámara disponible
              </p>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSwitchToManual}
              className="text-muted-foreground"
            >
              <FileQuestion className="h-4 w-4 mr-1" />
              ¿Factura de plaza o manuscrita? Usar modo manual
            </Button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="sr-only"
              capture="environment"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // MULTI-CAPTURE MODE
  if (mode === 'multi_capture') {
    return (
      <MultiCaptureScanner
        onComplete={handleMultiCaptureComplete}
        onCancel={resetState}
        restrictToCamera={isCashierOnly}
      />
    );
  }

  // PROCESSING STATE
  if (mode === 'processing') {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div>
              <p className="font-medium">🤖 IA analizando factura...</p>
              <p className="text-sm text-muted-foreground">
                Extrayendo proveedor • Detectando productos • Validando totales
              </p>
            </div>
          </div>
          <div className="mt-3 bg-primary/20 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => { setFallbackReason('user_requested'); setMode('manual'); }}>
              <AlertTriangle className="h-4 w-4 mr-1" />
              Usar modo manual
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // BLOCKED STATE - Critical data missing
  if (mode === 'blocked' && validation) {
    return (
      <ReceiptBlockedState
        validation={validation}
        confidenceBreakdown={confidenceBreakdown || undefined}
        onRescan={resetState}
        onManualEntry={handleSwitchToManual}
        onCancel={resetState}
      />
    );
  }

  // ASSISTED MODE - Review and edit
  if (mode === 'assisted' && extractedData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={validation?.status === 'needs_review' ? 'secondary' : 'default'}>
              {receiptState === 'needs_review' ? '⚠️ Revisión requerida' : '✅ Pendiente confirmación'}
            </Badge>
            <Badge variant="outline">
              Confianza real: {confidenceBreakdown?.weighted || 0}%
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowExitWarning(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Nueva factura
          </Button>
        </div>
        
        <AssistedReceiptReview
          extractedData={{
            ...extractedData,
            // Override con confianza REAL
            confidence: confidenceBreakdown?.weighted || 0
          }}
          receiptUrl={receiptUrl || undefined}
          onComplete={handleComplete}
          onSwitchToManual={handleSwitchToManual}
          onCancel={() => setShowExitWarning(true)}
        />

        <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar proceso?</AlertDialogTitle>
              <AlertDialogDescription>
                Perderás los datos extraídos. La imagen de la factura se conservará.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar editando</AlertDialogCancel>
              <AlertDialogAction onClick={resetState}>Sí, cancelar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // MANUAL MODE - Full manual entry
  if (mode === 'manual') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Modo: Entrada Manual</Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowExitWarning(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Nueva factura
          </Button>
        </div>

        <ManualReceiptForm
          receiptUrl={receiptUrl || undefined}
          fallbackReason={fallbackReason}
          partialData={extractedData}
          onComplete={handleComplete}
          onCancel={() => setShowExitWarning(true)}
        />

        <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar entrada?</AlertDialogTitle>
              <AlertDialogDescription>
                Perderás los datos ingresados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar</AlertDialogCancel>
              <AlertDialogAction onClick={resetState}>Sí, cancelar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null;
};

export default ReceiptProcessor;
