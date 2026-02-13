import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Qué puede hacer ALICIA?",
  "¿Cómo sube el ticket promedio?",
  "¿Cómo maneja los domicilios?",
  "¿Qué pasa si un cliente tiene una queja?",
];

const AliciaDemoChat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy ALICIA, la vendedora IA de Conektao. Pregúntame lo que quieras sobre cómo puedo ayudar a tu restaurante a vender más por WhatsApp.",
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
          content: "Hubo un problema conectando conmigo. Por favor intenta de nuevo en un momento.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="demo" className="relative z-10 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Pregúntale lo que quieras
          </h2>
          <p className="text-lg text-muted-foreground font-semibold">
            Habla con ALICIA ahora mismo y descubre cómo trabaja
          </p>
        </div>

        {/* Chat container */}
        <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl" style={{ boxShadow: "0 0 60px hsl(174 100% 29% / 0.1)" }}>
          {/* Messages */}
          <div ref={scrollRef} className="h-[400px] overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-primary to-secondary"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-muted/50 text-foreground border border-border/30"
                      : "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted/50 rounded-2xl px-4 py-3 border border-border/30">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  {s}
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
              placeholder="Escribe tu pregunta..."
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
