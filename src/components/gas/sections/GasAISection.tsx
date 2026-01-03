import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Bot, 
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Truck,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GasAISectionProps {
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "¿Cómo estuvo el día de hoy?", color: "text-emerald-400" },
  { icon: AlertTriangle, text: "¿Hay algo que deba revisar?", color: "text-amber-400" },
  { icon: Truck, text: "¿Quién tuvo más merma esta semana?", color: "text-red-400" },
  { icon: DollarSign, text: "¿Cuánto vendimos hoy?", color: "text-blue-400" },
];

const GasAISection: React.FC<GasAISectionProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .single();

      const { data, error } = await supabase.functions.invoke('gas-ai-copilot', {
        body: { 
          tenantId: profile?.restaurant_id,
          queryType: 'chat',
          userMessage: text.trim()
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hubo un problema conectando. ¿Puedes intentar de nuevo?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[700px]">
      {/* Header minimalista */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/30">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border/30 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">IA Conektao</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Hola, ¿en qué te ayudo?
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Pregúntame sobre ventas, mermas, conductores o cualquier cosa de tu operación.
              </p>
            </motion.div>

            {/* Preguntas sugeridas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED_QUESTIONS.map((q, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(q.text)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-purple-500/30 transition-all text-left group"
                >
                  <q.icon className={`w-4 h-4 ${q.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm text-foreground/80 group-hover:text-foreground">
                    {q.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-500 text-white rounded-br-md'
                        : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">IA Conektao</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - siempre visible abajo */}
      <div className="pt-3 border-t border-border/30">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="w-full px-4 py-3.5 pr-12 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>

        {/* Preguntas sugeridas inline cuando hay mensajes */}
        {messages.length > 0 && !isLoading && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(q.text)}
                className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-purple-500/30 text-muted-foreground hover:text-foreground transition-all"
              >
                {q.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GasAISection;
