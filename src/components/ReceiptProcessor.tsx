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
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ManualReceiptForm } from '@/components/receipt/ManualReceiptForm';
import { AssistedReceiptReview } from '@/components/receipt/AssistedReceiptReview';
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

interface ReceiptProcessorProps {
  onProcessComplete?: (data: any) => void;
}

type ProcessingMode = 'idle' | 'processing' | 'auto' | 'assisted' | 'manual';

const ReceiptProcessor: React.FC<ReceiptProcessorProps> = ({ onProcessComplete }) => {
  const [mode, setMode] = useState<ProcessingMode>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<'low_confidence' | 'handwritten' | 'user_requested' | 'ai_error'>('user_requested');
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const processReceipt = async (file: File) => {
    setMode('processing');
    setExtractedData(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" });
        setMode('idle');
        return;
      }

      // Upload original image
      const path = `receipts/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('receipts').upload(path, file, { contentType: file.type });

      let publicUrl: string | null = null;
      if (!uploadErr) {
        const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(path);
        publicUrl = publicData.publicUrl;
        setReceiptUrl(publicUrl);
      }

      // Resize for AI processing
      const imageBase64 = await resizeImage(file, 800);

      // Call AI processor
      const { data, error } = await supabase.functions.invoke('receipt-processor', {
        body: { imageBase64, userId: user.id, receiptUrl: publicUrl }
      });

      if (error) throw error;

      // Determine processing level based on response
      if (data.type === 'manual_required' || data.confidence < 50) {
        // LEVEL C: Manual fallback
        setFallbackReason(data.is_handwritten ? 'handwritten' : 'low_confidence');
        setExtractedData(data.data || null);
        setMode('manual');
        toast({ title: "Modo manual activado", description: "La IA no pudo leer claramente la factura" });
        
      } else if (data.confidence < 75 || data.has_low_confidence_items) {
        // LEVEL B: Assisted review
        setExtractedData(data.data || data);
        setMode('assisted');
        toast({ title: "Revisión requerida", description: "Algunos items necesitan verificación" });
        
      } else {
        // LEVEL A: Auto (still requires confirmation)
        setExtractedData(data.data || data);
        setMode('assisted'); // Even "auto" goes through assisted for confirmation
        toast({ title: "Factura procesada", description: "Revisa y confirma los datos" });
      }

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      
      // On error, offer manual fallback
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: "Máximo 5MB", variant: "destructive" });
        return;
      }
      processReceipt(file);
    }
  };

  const handleComplete = (result: any) => {
    onProcessComplete?.(result);
    resetState();
  };

  const resetState = () => {
    setMode('idle');
    setExtractedData(null);
    setReceiptUrl(null);
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
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">🚀 Procesador Inteligente de Facturas</h3>
              <p className="text-muted-foreground">
                La IA extraerá ingredientes, cantidades y precios automáticamente
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
              <Button onClick={() => cameraInputRef.current?.click()} className="h-12">
                <Camera className="h-4 w-4 mr-2" />
                📸 Fotografiar
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-12">
                <Upload className="h-4 w-4 mr-2" />
                📁 Subir Archivo
              </Button>
            </div>

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

  // PROCESSING STATE
  if (mode === 'processing') {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div>
              <p className="font-medium">🤖 IA procesando factura...</p>
              <p className="text-sm text-muted-foreground">
                Analizando imagen • Extrayendo datos • Preparando inventario
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

  // ASSISTED MODE - Review and edit
  if (mode === 'assisted' && extractedData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Modo: Revisión Asistida</Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowExitWarning(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Nueva factura
          </Button>
        </div>
        
        <AssistedReceiptReview
          extractedData={extractedData}
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
