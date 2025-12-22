import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  MessageCircle,
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatInterface } from '@/components/ai/ChatInterface';
import PaymentMethodFlow, { PaymentInfo } from '@/components/billing/PaymentMethodFlow';
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

interface Message {
  type: 'ai' | 'user';
  message: string;
  timestamp: Date;
}

interface ReceiptProcessorProps {
  onProcessComplete?: (data: any) => void;
}

const ReceiptProcessor: React.FC<ReceiptProcessorProps> = ({ onProcessComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [inventoryUpdated, setInventoryUpdated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    setIsProcessing(true);
    setConversation([]);
    setConversationId(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para procesar facturas",
          variant: "destructive"
        });
        return;
      }

      // 1) Subir imagen original al storage para conservar evidencia
      const path = `receipts/${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadRes, error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(path, file, { contentType: file.type });

      let publicUrl: string | null = null;
      if (!uploadErr) {
        const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(path);
        publicUrl = publicData.publicUrl;
        setReceiptUrl(publicUrl);
      } else {
        console.warn('Error subiendo imagen de factura:', uploadErr);
      }

      // 2) Redimensionar para análisis rápido de IA
      const imageBase64 = await resizeImage(file, 800);

      // 3) Invocar función de procesamiento pasando también la URL pública
      const { data, error } = await supabase.functions.invoke('receipt-processor', {
        body: {
          imageBase64,
          userId: user.id,
          receiptUrl: publicUrl
        }
      });

      if (error) throw error;

      if (data.type === 'questions') {
        // AI has questions - start conversation
        setConversationId(data.conversation_id);
        setExtractedData(data.partial_data);
        
        const aiMessage: Message = {
          type: 'ai',
          message: `He analizado tu factura pero necesito aclarar algunas cosas:\n\n${data.questions.join('\n')}`,
          timestamp: new Date()
        };
        
        setConversation([aiMessage]);
        scrollToBottom();
        
        toast({
          title: "Factura parcialmente procesada",
          description: "Necesito algunos datos adicionales para completar el proceso",
        });

      } else if (data.type === 'confirmation_needed') {
        // Need user confirmation for inventory update
        setConversationId(data.conversation_id);
        setExtractedData(data.data);
        
        // Build message highlighting low confidence items
        let enhancedMessage = data.confirmation_message;
        if (data.data?.auto_suggestions?.inventory_updates) {
          const lowConfItems = data.data.auto_suggestions.inventory_updates.filter(
            (item: any) => item.confidence_score < 90
          );
          
          if (lowConfItems.length > 0) {
            enhancedMessage += '\n\n⚠️ ATENCIÓN: Los siguientes items tienen baja confianza, verifica antes de confirmar:\n';
            lowConfItems.forEach((item: any) => {
              enhancedMessage += `• ${item.suggestion} (confianza: ${item.confidence_score}%)\n`;
            });
          }
        }
        
        const confirmationMessage: Message = {
          type: 'ai',
          message: enhancedMessage,
          timestamp: new Date()
        };
        
        setConversation([confirmationMessage]);
        scrollToBottom();
        
        toast({
          title: "⚠️ Confirmación OBLIGATORIA requerida",
          description: "Revisa CUIDADOSAMENTE los datos extraídos antes de confirmar",
          duration: 8000,
        });

        setPendingConfirmation(true);

      } else if (data.type === 'success') {
        // Processing successful
        toast({
          title: "¡Factura procesada exitosamente!",
          description: data.message,
        });
        
        const successMessage: Message = {
          type: 'ai',
          message: `✅ ${data.message}\n\nDetalles:\n• Proveedor: ${data.data.supplier_name}\n• Total: $${data.data.total.toLocaleString()}\n• Productos: ${data.data.items.length}`,
          timestamp: new Date()
        };
        
        setConversation([successMessage]);
        onProcessComplete?.(data);
        
      } else if (data.type === 'low_confidence') {
        // Low confidence - ask for clarification
        const clarificationMessage: Message = {
          type: 'ai',
          message: `He procesado la factura pero la calidad de la imagen no es óptima (confianza: ${data.data.confidence}%).\n\n${data.questions.join('\n')}\n\n¿Podrías confirmar o corregir estos datos?`,
          timestamp: new Date()
        };
        
        setConversation([clarificationMessage]);
        setExtractedData(data.data);
        setConversationId(crypto.randomUUID());
      }

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      
      // Handle specific error types
      if (error.message?.includes('RATE_LIMIT') || error.status === 429) {
        toast({
          title: "Sistema ocupado",
          description: "Hay muchas facturas procesándose. Por favor intenta en unos segundos.",
          variant: "destructive",
          duration: 6000
        });
      } else if (error.message?.includes('PAYMENT_REQUIRED') || error.status === 402) {
        toast({
          title: "Servicio temporalmente no disponible",
          description: "El servicio de procesamiento de facturas no está disponible. Contacta soporte.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo procesar la factura. Inténtalo de nuevo.",
          variant: "destructive"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !conversationId) return;

    const userMessage: Message = {
      type: 'user',
      message: userInput,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('receipt-processor', {
        body: {
          userMessage: userInput,
          conversationId,
          userId: user.id
        }
      });

      if (error) throw error;

      // Check if this is a mapping creation
      if (data.type === 'mapping_created') {
        const successMessage: Message = {
          type: 'ai',
          message: data.message,
          timestamp: new Date()
        };
        
        setConversation(prev => [...prev, successMessage]);
        toast({
          title: "Asociación creada",
          description: "La IA recordará esta asociación para futuras facturas",
        });
        
        return;
      }

      // Check if this is inventory confirmation
      if (data.type === 'inventory_confirmed') {
        // Trigger automatic inventory update
        await triggerInventoryUpdate();
        
        const successMessage: Message = {
          type: 'ai',
          message: '🎉 ¡Inventario actualizado automáticamente!\n\nTodos los productos y cantidades han sido registrados. Los precios de costo se han guardado para futuros cálculos de costos.',
          timestamp: new Date()
        };
        
        setConversation(prev => [...prev, successMessage]);
        toast({
          title: "¡Inventario actualizado!",
          description: "Todos los productos han sido registrados automáticamente",
        });
        
        // Complete the process
        setTimeout(() => {
          onProcessComplete?.({ type: 'success', data: extractedData });
        }, 2000);
        
        return;
      }

      const aiMessage: Message = {
        type: 'ai',
        message: data.message,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, aiMessage]);
      scrollToBottom();

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 5MB",
          variant: "destructive"
        });
        return;
      }
      processReceipt(file);
    }
  };

  const triggerInventoryUpdate = async (paymentInfo?: PaymentInfo) => {
    if (!extractedData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call backend to process inventory updates with full payment info
      const { data, error } = await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData,
          userId: user.id,
          receiptUrl,
          paymentInfo: paymentInfo || null
        }
      });

      if (error) throw error;
      
      console.log('Inventory updated successfully:', data);
      setInventoryUpdated(true);
      return data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario automáticamente",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleConfirmInventory = async () => {
    // First update inventory without payment
    await triggerInventoryUpdate();
    setPendingConfirmation(false);
    
    // Now show payment flow - MANDATORY
    setShowPaymentFlow(true);
    
    const paymentMessage: Message = {
      type: 'ai',
      message: '📦 ¡Inventario actualizado! Ahora necesito saber cómo pagaste esta factura para mantener tus finanzas al día.',
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, paymentMessage]);
  };

  const handlePaymentComplete = async (paymentInfo: PaymentInfo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call backend to register the payment
      const { data, error } = await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData,
          userId: user.id,
          receiptUrl,
          paymentInfo,
          paymentOnly: true // Flag to only process payment, not inventory again
        }
      });

      if (error) throw error;

      setShowPaymentFlow(false);
      
      let paymentMessage = '';
      switch (paymentInfo.method) {
        case 'cash_register':
          paymentMessage = '💰 Pago en efectivo registrado en la caja del día.';
          break;
        case 'cash_petty':
          paymentMessage = '💵 Pago desde caja menor registrado.';
          break;
        case 'transfer':
          paymentMessage = '📱 Pago por transferencia registrado.';
          break;
        case 'card':
          paymentMessage = '💳 Pago con tarjeta registrado.';
          break;
        case 'credit':
          paymentMessage = `📝 Cuenta por pagar creada. Vence el ${paymentInfo.creditDueDate?.toLocaleDateString('es-ES')}.`;
          break;
        case 'split':
          paymentMessage = '🔄 Pago dividido registrado correctamente.';
          break;
      }

      const successMessage: Message = {
        type: 'ai',
        message: `🎉 ¡Proceso completado!\n\n${paymentMessage}\n\nTodo registrado: inventario, gasto y método de pago.`,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, successMessage]);
      
      toast({
        title: "¡Factura procesada completamente!",
        description: "Inventario y pago registrados correctamente",
      });

      setTimeout(() => {
        onProcessComplete?.({ type: 'success', data: extractedData, paymentInfo });
      }, 1500);

    } catch (error) {
      console.error('Error registering payment:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive"
      });
    }
  };

  const handleCancelWithWarning = () => {
    if (inventoryUpdated && !showPaymentFlow) {
      // Inventory was updated but payment not registered - show warning
      setShowExitWarning(true);
    } else if (showPaymentFlow) {
      // User is in payment flow - show warning
      setShowExitWarning(true);
    } else {
      // No data processed yet, safe to cancel
      resetState();
    }
  };

  const resetState = () => {
    setConversation([]);
    setConversationId(null);
    setExtractedData(null);
    setShowPaymentFlow(false);
    setInventoryUpdated(false);
    setPendingConfirmation(false);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Procesador de Facturas con IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversation.length === 0 && !isProcessing && (
            <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">🚀 Procesador Inteligente de Facturas con IA</h3>
                    <p className="text-muted-foreground">
                      ⚡ La IA extraerá automáticamente ingredientes, cantidades y precios
                    </p>
                    <p className="text-sm text-primary mt-2">
                      💡 Puedes decirle: "el producto Pulpa Açaí 500g es del ingrediente Pulpa de Açaí" y la IA lo recordará para futuras facturas
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mx-auto">
                    <Button onClick={openCamera} className="bg-primary hover:bg-primary/90 h-12">
                      <Camera className="h-4 w-4 mr-2" />
                      📸 Fotografiar
                    </Button>
                    <Button variant="outline" onClick={openFileUpload} className="h-12">
                      <Upload className="h-4 w-4 mr-2" />
                      📁 Subir Archivo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📱 En móvil: "Fotografiar" abre cámara • "Subir" abre galería/archivos
                  </p>
                </div>
              </div>
              
              {/* Input para cámara (móvil) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
                capture="environment"
              />
              
              {/* Input para archivos (galería/PC) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/jpeg,image/png,image/jpg,.pdf"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>
          )}

          {isProcessing && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="font-medium text-blue-800">🤖 IA procesando factura...</p>
                      <p className="text-sm text-blue-600">
                        ⚡ Analizando imagen • 🔍 Extrayendo datos • 📦 Preparando actualización de inventario
                      </p>
                    </div>
                  </div>
                <div className="mt-3 bg-blue-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </CardContent>
            </Card>
          )}

          {conversation.length > 0 && (
            <div className="space-y-4">
              <ChatInterface 
                conversation={conversation}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
              />
              
              {showPaymentFlow && extractedData && (
                <PaymentMethodFlow
                  totalAmount={extractedData.total || 0}
                  supplierName={extractedData.supplier_name || 'Proveedor'}
                  onComplete={handlePaymentComplete}
                  onCancel={handleCancelWithWarning}
                />
              )}
              
              {pendingConfirmation && !showPaymentFlow && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-900">
                      ⚠️ CONFIRMACIÓN OBLIGATORIA
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Revisa cuidadosamente los datos extraídos arriba. Los items marcados con ⚠️ tienen baja confianza y deben verificarse.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleConfirmInventory()} disabled={isTyping} className="bg-green-600 hover:bg-green-700">
                      ✅ He verificado - Actualizar inventario
                    </Button>
                    <Button variant="outline" onClick={handleCancelWithWarning} disabled={isTyping}>
                      ❌ Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {!pendingConfirmation && conversationId && (
                <div className="flex gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!userInput.trim() || isTyping}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {!showPaymentFlow && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelWithWarning}
                  >
                    Procesar Nueva Factura
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {extractedData && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Datos Extraídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Proveedor:</strong> {extractedData.supplier_name}</p>
                <p><strong>Fecha:</strong> {extractedData.date}</p>
                <p><strong>Total:</strong> ${extractedData.total?.toLocaleString()}</p>
              </div>
              <div>
                <p><strong>Productos:</strong> {extractedData.items?.length || 0}</p>
                <p><strong>Confianza:</strong> 
                  <Badge variant={extractedData.confidence > 80 ? 'default' : 'secondary'} className="ml-2">
                    {extractedData.confidence}%
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Warning Dialog */}
      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ¿Salir sin completar el pago?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ya actualizaste el inventario, pero no registraste cómo pagaste esta factura. 
              Si sales ahora, tus números de caja y cuentas por pagar no estarán correctos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver y registrar pago</AlertDialogCancel>
            <AlertDialogAction 
              onClick={resetState}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Salir sin registrar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceiptProcessor;