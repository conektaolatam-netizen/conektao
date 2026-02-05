import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Loader2, Lightbulb, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConektaoChatProps {
  branchId?: string;
}

const suggestedQuestions = [
  { icon: TrendingUp, text: "¿Cómo van las ventas hoy?", color: "text-emerald-600" },
  { icon: ShoppingBag, text: "¿Cuáles son los productos más vendidos?", color: "text-sky-600" },
  { icon: Users, text: "¿Cómo está el rendimiento del personal?", color: "text-violet-600" },
  { icon: Lightbulb, text: "¿Qué puedo mejorar hoy?", color: "text-amber-600" },
];

const ConektaoChat: React.FC<ConektaoChatProps> = ({ branchId = "zona-t" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
        `https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/crepes-chat-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c3F2amNnY3Vrb3N1c2tzdWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjgzMTIsImV4cCI6MjA2OTUwNDMxMn0.aTDy7G6E9olaZwtpLW3Lgw4MAfeO704xI4QfIR0SDrg`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            branch_id: branchId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al conectar con la IA');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }

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
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.' }
      ]);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#5C4033] flex items-center justify-center shadow-lg"
          animate={{ 
            boxShadow: ['0 4px 20px rgba(92,64,51,0.2)', '0 4px 30px rgba(92,64,51,0.35)', '0 4px 20px rgba(92,64,51,0.2)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-[#F5EDE4]" />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-[#4A3728]">Conektao AI</h2>
          <p className="text-sm text-[#8B7355]">Chat conectado a datos reales</p>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 bg-white border-[#D4C4B0] shadow-sm overflow-hidden flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#5C4033] flex items-center justify-center mb-4 shadow-lg"
                >
                  <Bot className="w-8 h-8 text-[#F5EDE4]" />
                </motion.div>
                <h3 className="text-lg font-semibold text-[#4A3728] mb-2">
                  ¡Hola! Soy tu asistente de inteligencia
                </h3>
                <p className="text-sm text-[#8B7355] mb-6 max-w-sm">
                  Estoy conectado a los datos reales de tu sucursal. Pregúntame lo que quieras.
                </p>
                
                {/* Suggested Questions */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {suggestedQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => handleSend(question.text)}
                      className="flex items-center gap-2 p-3 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4] hover:border-[#D4C4B0] hover:bg-[#F5EDE4] transition-all text-left group"
                    >
                      <question.icon className={`w-4 h-4 ${question.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-xs text-[#4A3728]">{question.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B7355] to-[#5C4033] flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-[#F5EDE4]" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-[#5C4033] text-white rounded-br-md'
                            : 'bg-[#FDF8F3] border border-[#E8DFD4] text-[#4A3728] rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-[#E8DFD4] flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#5C4033]" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B7355] to-[#5C4033] flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-[#F5EDE4] animate-spin" />
                    </div>
                    <div className="bg-[#FDF8F3] border border-[#E8DFD4] p-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Pregunta sobre tu sucursal..."
              className="flex-1 min-h-[44px] max-h-32 resize-none border-[#D4C4B0] focus:border-[#8B7355] bg-white"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-[#5C4033] hover:bg-[#4A3728] h-auto text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ConektaoChat;
