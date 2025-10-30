import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  MessageCircle, 
  Brain, 
  Zap, 
  Send,
  RotateCcw,
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { conektaoAI } from '@/lib/aiEngine';
import { ChatInterface } from '@/components/ai/ChatInterface';

interface Message {
  type: 'ai' | 'user';
  message: string;
  timestamp: Date;
}

const OptimizedAIAssistant: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsageInfo();
    initWelcomeMessage();
  }, []);

  const loadUsageInfo = async () => {
    try {
      const { data } = await supabase.functions.invoke('ai-usage-control', {
        body: { action: 'get_usage' }
      });
      setUsageInfo(data);
    } catch (error) {
      console.error('Error loading usage info:', error);
    }
  };

  const initWelcomeMessage = () => {
    setConversation([{
      type: 'ai',
      message: '¡Hola! Soy tu asistente IA de Conektao, optimizado y conectado a tus datos reales. Puedo ayudarte con análisis de ventas, estrategias de marketing, optimización de inventario y mucho más. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || isTyping) return;

    // Check usage limits
    if (usageInfo?.usage_today?.remaining <= 0) {
      toast({
        title: "Límite alcanzado",
        description: "Has agotado tus consultas diarias. Considera actualizar tu plan.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = currentQuestion.trim();
    setCurrentQuestion('');
    setIsTyping(true);

    // Add user message to conversation
    const newUserMessage: Message = {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, newUserMessage]);

    try {
      // Get user context
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user?.id)
        .single();

      // Call standardized AI function directly
      const { data, error: aiError } = await supabase.functions.invoke('conektao-ai', {
        body: { message: userMessage }
      });

      if (aiError) {
        throw aiError;
      }

      const response = data?.response || 'No se pudo generar una respuesta. Intenta nuevamente.';

      const aiMessage: Message = {
        type: 'ai',
        message: response,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, aiMessage]);
      
      // Reload usage info
      loadUsageInfo();

      toast({
        title: "Respuesta generada",
        description: "La IA ha analizado tu consulta con datos reales",
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        type: 'ai',
        message: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
        timestamp: new Date()
      };

      setConversation(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la consulta",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions = [
    { text: "Analiza mis ventas de hoy", icon: "📊" },
    { text: "¿Qué productos venden menos?", icon: "📉" },
    { text: "Genera estrategia de marketing", icon: "🎯" },
    { text: "Optimiza mi inventario", icon: "📦" },
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuestion(suggestion);
  };

  const clearConversation = () => {
    setConversation([]);
    initWelcomeMessage();
  };

  const isAtLimit = usageInfo?.usage_today?.remaining <= 0;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[hsl(var(--ai-surface))] text-[hsl(var(--ai-foreground))] border-[hsl(var(--ai-border))]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span>IA Conektao - Asistente Optimizado</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Conectado a datos reales
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {usageInfo && (
              <Badge 
                variant={isAtLimit ? "destructive" : "secondary"}
                className="text-xs"
              >
                {usageInfo.usage_today.remaining} consultas restantes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearConversation}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAtLimit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Límite diario alcanzado</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Has usado todas tus consultas diarias. Actualiza tu plan para continuar.
            </p>
          </div>
        )}

        {/* Quick Suggestions */}
        {conversation.length <= 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="text-xs p-2 h-auto"
                disabled={isAtLimit}
              >
                <span className="mr-1">{suggestion.icon}</span>
                {suggestion.text}
              </Button>
            ))}
          </div>
        )}

        {/* Chat Interface */}
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto border border-[hsl(var(--ai-border))] rounded-lg p-0 bg-[hsl(var(--ai-surface))]">
          <ChatInterface 
            conversation={conversation}
            isTyping={isTyping}
            messagesEndRef={React.useRef<HTMLDivElement>(null)}
            variant="dark"
          />
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAtLimit ? "Has alcanzado tu límite diario..." : "Escribe tu consulta aquí... Presiona Enter para enviar"}
            disabled={isTyping || isAtLimit}
            className="resize-none bg-[hsl(var(--ai-surface))] text-[hsl(var(--ai-foreground))] border-[hsl(var(--ai-border))] placeholder:text-[hsl(var(--muted-foreground))]"
            rows={3}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {usageInfo && (
                <>
                  Costo promedio: ${(usageInfo.usage_today.total_cost_usd / Math.max(usageInfo.usage_today.total_questions, 1)).toFixed(6)} USD por consulta
                </>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!currentQuestion.trim() || isTyping || isAtLimit}
              className="min-w-[100px]"
            >
              {isTyping ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* AI Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
          <div className="text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h4 className="font-semibold text-sm">Chat Inteligente</h4>
            <p className="text-xs text-muted-foreground">Conectado a tus datos de ventas</p>
          </div>
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="font-semibold text-sm">Análisis Rápido</h4>
            <p className="text-xs text-muted-foreground">Respuestas optimizadas en segundos</p>
          </div>
          <div className="text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h4 className="font-semibold text-sm">IA Avanzada</h4>
            <p className="text-xs text-muted-foreground">GPT-4o-mini para eficiencia</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizedAIAssistant;