import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Loader2, TrendingUp, Building2, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AIGlowBorder from '../ui/AIGlowBorder';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  { icon: TrendingUp, text: "¿Cómo van las ventas de la región hoy?", color: "text-emerald-400" },
  { icon: AlertTriangle, text: "¿Qué sucursal necesita atención urgente?", color: "text-rose-400" },
  { icon: Building2, text: "Compara las ventas de Andino vs San Martín", color: "text-sky-400" },
  { icon: MapPin, text: "¿Qué recomiendas para mañana en cada sucursal?", color: "text-amber-400" },
];

const RegionalConektaoChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crepes-regional-chat-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok) throw new Error('Error al conectar con la IA');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error. Por favor intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AIGlowBorder className="flex-1 flex flex-col h-full">
      <div className="bg-[#1a1a2e] flex flex-col h-full rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <motion.div
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#FF6B35] flex items-center justify-center"
            animate={{ boxShadow: ['0 0 15px rgba(0,212,170,0.3)', '0 0 25px rgba(255,107,53,0.3)', '0 0 15px rgba(0,212,170,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-base font-bold text-white">Conektao AI Regional</h2>
            <p className="text-xs text-white/40">Conectado a datos de 5 sucursales</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#FF6B35] flex items-center justify-center mb-4"
                style={{ boxShadow: '0 0 30px rgba(0,212,170,0.2)' }}
              >
                <Bot className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Inteligencia Regional
              </h3>
              <p className="text-xs text-white/40 mb-6 max-w-sm">
                Pregúntame sobre cualquier sucursal de tu región. Tengo acceso a ventas, auditoría, personal y más.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {suggestedQuestions.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#00D4AA]/30 hover:bg-white/10 transition-all text-left group"
                  >
                    <q.icon className={`w-4 h-4 ${q.color} group-hover:scale-110 transition-transform flex-shrink-0`} />
                    <span className="text-xs text-white/70">{q.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#FF6B35] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white rounded-br-md'
                        : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-white/60" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#FF6B35] flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                  <div className="bg-white/10 border border-white/10 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Pregunta sobre tu región..."
              className="flex-1 min-h-[44px] max-h-32 resize-none bg-white/5 border-white/10 focus:border-[#00D4AA]/50 text-white placeholder:text-white/30"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00D4AA] h-auto text-white border-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AIGlowBorder>
  );
};

export default RegionalConektaoChat;
