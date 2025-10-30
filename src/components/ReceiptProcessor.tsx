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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatInterface } from '@/components/ai/ChatInterface';

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
  const [pendingPaymentConfirmation, setPendingPaymentConfirmation] = useState(false);
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
        
        const confirmationMessage: Message = {
          type: 'ai',
          message: data.confirmation_message,
          timestamp: new Date()
        };
        
        setConversation([confirmationMessage]);
        scrollToBottom();
        
        toast({
          title: "Confirmación requerida",
          description: "Revisa las actualizaciones de inventario propuestas",
        });

        setPendingConfirmation(true);
        // Si incluye información de pago, también activamos esa confirmación
        if (data.payment_required) {
          setPendingPaymentConfirmation(true);
        }

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

    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la factura. Inténtalo de nuevo.",
        variant: "destructive"
      });
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

  const triggerInventoryUpdate = async (paidWithCash: boolean = false) => {
    if (!extractedData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call backend to process inventory updates
      const { data, error } = await supabase.functions.invoke('update-inventory-from-receipt', {
        body: {
          extractedData,
          userId: user.id,
          receiptUrl,
          paidWithCash
        }
      });

      if (error) throw error;
      
      console.log('Inventory updated successfully:', data);
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario automáticamente",
        variant: "destructive"
      });
    }
  };

  const handleConfirmInventory = async (paidWithCash: boolean = false) => {
    await triggerInventoryUpdate(paidWithCash);
    setPendingConfirmation(false);
    setPendingPaymentConfirmation(false);

    const successMessage: Message = {
      type: 'ai',
      message: `🎉 ¡Inventario actualizado automáticamente! Todos los productos y cantidades han sido registrados.${paidWithCash ? '\n\n💰 Pago en efectivo registrado en la caja.' : ''}`,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, successMessage]);
    toast({
      title: "¡Inventario actualizado!",
      description: paidWithCash ? "Inventario y pago en efectivo registrados" : "Todos los productos han sido registrados automáticamente",
    });

    setTimeout(() => {
      onProcessComplete?.({ type: 'success', data: extractedData });
    }, 1500);
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
            Procesador de Facturas IA
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
                    <h3 className="text-lg font-semibold">🚀 Procesador Súper Rápido de Facturas</h3>
                    <p className="text-muted-foreground">
                      ⚡ La IA extraerá datos en segundos, hará preguntas si es necesario y actualizará automáticamente tu inventario con confirmación
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
                    <p className="font-medium text-blue-800">🚀 Procesando factura súper rápido...</p>
                    <p className="text-sm text-blue-600">
                      ⚡ Extrayendo datos • 🔍 Identificando productos • 📦 Preparando inventario
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
              
              {pendingConfirmation && (
                <div className="space-y-3">
                  {pendingPaymentConfirmation && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleConfirmInventory(true)} disabled={isTyping} className="bg-green-600 hover:bg-green-700">
                        💰 Sí, pagué en EFECTIVO
                      </Button>
                      <Button onClick={() => handleConfirmInventory(false)} disabled={isTyping} variant="outline">
                        💳 No, pagué con otro método
                      </Button>
                    </div>
                  )}
                  {!pendingPaymentConfirmation && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleConfirmInventory(false)} disabled={isTyping}>
                        ✅ Confirmar actualización de inventario
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setPendingConfirmation(false);
                        setPendingPaymentConfirmation(false);
                      }} disabled={isTyping}>
                        Cancelar
                      </Button>
                    </div>
                  )}
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

              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setConversation([]);
                    setConversationId(null);
                    setExtractedData(null);
                  }}
                >
                  Procesar Nueva Factura
                </Button>
              </div>
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
    </div>
  );
};

export default ReceiptProcessor;