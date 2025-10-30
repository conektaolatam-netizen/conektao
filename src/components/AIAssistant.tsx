import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { conektaoAI } from '@/lib/aiEngine';
import { 
  Brain,
  Send,
  Sparkles,
  Bot,
  ChefHat,
  Coffee,
  Pizza,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  Package,
  Target,
  Heart,
  Clock,
  Smile,
  Mic,
  Image,
  Paperclip,
  MoreHorizontal,
  ThumbsUp,
  Copy,
  Zap
} from 'lucide-react';

// Tipado explícito de mensajes de chat
type ChatMsg = { id: number; type: 'ai' | 'user'; message: string; timestamp: Date; reactions: string[] };

const AIAssistant = () => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, profile, restaurant } = useAuth();
  
  const [conversation, setConversation] = useState<ChatMsg[]>([
    {
      id: 1,
      type: 'ai',
      message: 'Hola! Soy ConektAI. Estoy aquí para ayudarte con todo lo relacionado a tu restaurante: ventas, inventario, personal, marketing, recetas y mucho más. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
      reactions: []
    }
  ]);

  const [pendingCostProposal, setPendingCostProposal] = useState<null | { name: string; cost_price: number; breakdown?: string; confidence?: string }>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isTyping]);

  // Preload message from other modules (e.g., Billing)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_preload_message');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.message) {
          setCurrentQuestion(parsed.message);
          setShowSuggestions(false);
          setTimeout(() => handleSendMessage(), 0);
        }
        localStorage.removeItem('ai_preload_message');
      }
    } catch {}
  }, []);


  const quickSuggestions = [
    {
      text: "Optimiza mis ventas y reduce costos innecesarios",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200"
    },
    {
      text: "Analiza eficiencia y mejora mis procesos",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    },
    {
      text: "Estrategia para maximizar ganancias hoy",
      icon: DollarSign,
      color: "bg-green-100 text-green-700 hover:bg-green-200"
    },
    {
      text: "Optimiza inventario y elimina desperdicios",
      icon: Package,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200"
    },
    {
      text: "Mejora productividad del equipo",
      icon: Users,
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
    },
    {
      text: "Automatiza procesos repetitivos",
      icon: Zap,
      color: "bg-pink-100 text-pink-700 hover:bg-pink-200"
    }
  ];

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || isTyping) return;
    
    const userMessage: ChatMsg = {
      id: Date.now(),
      type: 'user' as const,
      message: currentQuestion,
      timestamp: new Date(),
      reactions: []
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Optimizar mensaje para análisis de mejora
      const optimizedMessage = `Para ${restaurant?.name || 'mi restaurante'}: responde SOLO en 4-6 bullets, ultra directo y con emojis; máximo 80 palabras; sin párrafos ni tablas. Enfócate en optimización de recursos, eficiencia, reducción de costos, aumento de ventas y mejora de procesos. Pregunta: ${userMessage.message}`;
      
      const { data, error } = await supabase.functions.invoke('conektao-ai', {
        body: { 
          message: optimizedMessage
        }
      });

      if (error) {
        console.error('Error calling Conektao AI:', error);
        // Fallback mejorado con enfoque en optimización
        const aiResponse = await conektaoAI.generateResponse(optimizedMessage);
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai' as const,
          message: aiResponse,
          timestamp: new Date(),
          reactions: []
        };
        setConversation(prev => [...prev, aiMessage]);
      } else if (data?.response) {
        console.log('✅ GPT response received with optimization focus');
        
        // Check if a product was automatically updated
        if (data?.productUpdated) {
          toast({
            title: "✅ Optimización aplicada",
            description: "Los datos han sido optimizados automáticamente",
          });
        }
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai' as const,
          message: data.response,
          timestamp: new Date(),
          reactions: []
        };
        setConversation(prev => [...prev, aiMessage]);
      } else {
        throw new Error('No response received');
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Error message con enfoque en soluciones
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai' as const,
        message: '🔧 Detecté un problema de conectividad. Para optimizar tu experiencia, revisa tu conexión a internet o contáctanos. Mientras tanto, puedo ayudarte con análisis offline básicos.',
        timestamp: new Date(),
        reactions: []
      };
      setConversation(prev => [...prev, errorMessage]);
      
      toast({
        title: "Problema de conexión",
        description: "Revisa tu internet o contacta soporte",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuestion(suggestion);
    setShowSuggestions(false);
    setTimeout(() => handleSendMessage(), 0);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (messageId: number, reaction: string) => {
    setConversation(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
          : msg
      )
    );
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Copiado al portapapeles",
      description: "El mensaje se ha copiado correctamente",
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ai-surface))]">
      {/* Header negro */}
      <div className="bg-[hsl(var(--ai-surface))] backdrop-blur-xl border-b border-[hsl(var(--ai-border))] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[hsl(var(--ai-surface))] animate-pulse shadow-lg shadow-green-400/50"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  🚀 Conektao AI Pro
                </h1>
                <p className="text-sm text-cyan-300/70">Asistente con datos privados de tu restaurante</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-black border-0 px-3 py-1 rounded-full shadow-lg shadow-green-400/25">
              <Zap className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Quick Suggestions - Futuristic Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className="group relative overflow-hidden bg-[hsl(var(--ai-surface))] backdrop-blur-sm rounded-2xl p-4 border border-[hsl(var(--ai-border))] hover:border-cyan-400/40 hover:bg-[hsl(var(--ai-surface))]/80 hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-500/10"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <suggestion.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs font-medium text-cyan-100 text-left leading-tight">
                  {suggestion.text}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Chat Interface - Diseño Negro Total */}
        <div className="bg-[hsl(var(--ai-surface))] backdrop-blur-xl border border-[hsl(var(--ai-border))] shadow-2xl shadow-cyan-500/10 rounded-3xl overflow-hidden">
          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-[hsl(var(--ai-surface))]">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[80%] ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-3xl rounded-br-lg shadow-lg shadow-cyan-500/25' 
                    : 'bg-[hsl(var(--ai-surface))] backdrop-blur-sm border border-[hsl(var(--ai-border))] rounded-3xl rounded-bl-lg shadow-lg shadow-purple-500/10'
                } p-4 relative`}>
                  {msg.type === 'ai' && (
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        🚀 Conektao AI Pro
                      </span>
                      <Badge className="ml-2 bg-gradient-to-r from-green-400/20 to-emerald-500/20 border border-green-400/30 text-green-300 text-xs px-2 py-0 rounded-full">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    </div>
                  )}
                   <div className={`whitespace-pre-line leading-relaxed text-sm ${
                     msg.type === 'user' ? 'text-white font-medium' : 'text-[hsl(var(--ai-foreground))]'
                   }`}>
                     {msg.message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                   </div>
                  <p className={`text-xs mt-3 ${
                    msg.type === 'user' ? 'text-cyan-200/60' : 'text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-[hsl(var(--ai-surface))] backdrop-blur-sm border border-[hsl(var(--ai-border))] rounded-3xl rounded-bl-lg shadow-lg shadow-purple-500/10 p-4 max-w-[80%]">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      🚀 Analizando datos seguros...
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Diseño Negro */}
          <div className="p-4 bg-[hsl(var(--ai-surface))] backdrop-blur-xl border-t border-[hsl(var(--ai-border))]">
            {/* Pending cost proposal confirmation */}
            {pendingCostProposal && (
              <div className="mb-3 p-3 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Propuesta de costo detectada para "{pendingCostProposal.name}"</p>
                  <p className="text-xs">Costo sugerido: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pendingCostProposal.cost_price)}</p>
                  {pendingCostProposal.breakdown && <p className="text-xs opacity-80 mt-1">{pendingCostProposal.breakdown}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await conektaoAI.updateProductWithCalculatedCost({
                        name: pendingCostProposal.name,
                        cost_price: pendingCostProposal.cost_price
                      });
                      if (ok) {
                        toast({ title: 'Costo actualizado', description: 'El producto fue actualizado correctamente' });
                        setPendingCostProposal(null);
                        const confirmMessage = {
                          id: Date.now() + 2,
                          type: 'ai' as const,
                          message: `✅ Costo actualizado en la base de datos para "${pendingCostProposal.name}". ¿Deseas que revise márgenes y precios recomendados?`,
                          timestamp: new Date(),
                          reactions: []
                        };
                        setConversation(prev => [...prev, confirmMessage]);
                      } else {
                        toast({ title: 'No se pudo actualizar', description: 'Intenta nuevamente', variant: 'destructive' });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Confirmar actualización
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingCostProposal(null)}>Cancelar</Button>
                </div>
              </div>
            )}
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="¿Cómo puedo optimizar y mejorar mi restaurante? Pregúntame..."
                  className="bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))] rounded-2xl py-3 px-4 pr-12 text-sm text-[hsl(var(--ai-foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:bg-[hsl(var(--ai-surface))] focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  disabled={isTyping}
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-200"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!currentQuestion.trim() || isTyping}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white border-0 rounded-2xl px-6 py-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI Capabilities - Sección Negro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              icon: ChefHat, 
              title: "📊 Inventario Inteligente", 
              desc: "Análisis de stock solo de tu restaurante con datos seguros", 
              gradient: "from-green-500 to-emerald-600",
              special: true
            },
            { 
              icon: Coffee, 
              title: "🔍 Análisis de Ventas", 
              desc: "Datos reales en tiempo real de tu negocio específico", 
              gradient: "from-blue-500 to-cyan-600",
              special: true
            },
            { 
              icon: Pizza, 
              title: "🎯 Marketing Personalizado", 
              desc: "Estrategias basadas en el comportamiento de TUS clientes", 
              gradient: "from-purple-500 to-indigo-600",
              special: true
            },
            { 
              icon: Sparkles, 
              title: "⚡ Optimización Automática", 
              desc: "Mejoras continuas automáticas para tu restaurante específico", 
              gradient: "from-orange-500 to-red-600",
              special: true
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="group relative overflow-hidden bg-[hsl(var(--ai-surface))] backdrop-blur-sm rounded-2xl p-4 border border-[hsl(var(--ai-border))] hover:border-cyan-400/40 hover:bg-[hsl(var(--ai-surface))]/80 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="relative z-10">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-[hsl(var(--ai-foreground))] mb-2 group-hover:text-cyan-100 transition-colors">
                  {feature.title}
                </h4>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed group-hover:text-cyan-200/70 transition-colors">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;