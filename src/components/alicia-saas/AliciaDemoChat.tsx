import React, { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, ShoppingCart, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import aliciaAvatar from "@/assets/alicia-avatar.png";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { label: "🍕 Quiero pedir una pizza", icon: ShoppingCart },
  { label: "¿Qué puede hacer ALICIA?", icon: HelpCircle },
  { label: "¿Cómo sube el ticket promedio?", icon: Sparkles },
  { label: "¿Cuánto cuesta el plan?", icon: HelpCircle },
];

const AliciaDemoChat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy ALICIA, tu vendedora IA.\n\nPuedes preguntarme cómo funciono o simular un pedido como si fueras un cliente de tu restaurante. ¡Pruébame! 🍕",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("alicia-demo-chat", {
        body: { messages: allMessages.map((m) => ({ role: m.role, content: m.content })) },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.reply || "Lo siento, no pude procesar tu pregunta. Intenta de nuevo." },
      ]);
    } catch (err) {
      console.error("Demo chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hubo un problema conectando conmigo. Por favor intenta de nuevo en un momento. 😊",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <section id="demo" className="relative z-10 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Habla con ALICIA ahora
          </h2>
          <p className="text-lg text-muted-foreground font-semibold">
            Pregúntale lo que quieras o simula un pedido como lo haría un cliente real
          </p>
        </div>

        {/* Chat container — WhatsApp-style */}
        <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl" style={{ boxShadow: "0 0 60px hsl(174 100% 29% / 0.1)" }}>
          
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border/30 bg-muted/30">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 shrink-0">
              <img src={aliciaAvatar} alt="ALICIA" className="w-full h-full object-cover" style={{ objectPosition: '50% 20%' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">ALICIA</p>
              <p className="text-xs text-primary font-medium">En línea • Vendedora IA</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[380px] overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/30">
                    <img src={aliciaAvatar} alt="ALICIA" className="w-full h-full object-cover" style={{ objectPosition: '50% 20%' }} />
                  </div>
                )}
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-muted/50 text-foreground border border-border/30"
                      : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  }`}
                >
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/30">
                  <img src={aliciaAvatar} alt="ALICIA" className="w-full h-full object-cover" style={{ objectPosition: '50% 20%' }} />
                </div>
                <div className="bg-muted/50 rounded-2xl px-4 py-3 border border-border/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s.label)}
                  className="text-xs px-3 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 sm:p-6 border-t border-border/30 flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Escribe un mensaje... ej: 'Quiero una pizza mediana'"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              onClick={() => send(input)}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-primary-foreground shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AliciaDemoChat;
