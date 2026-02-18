import React, { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, ShoppingCart, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";
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

  const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.1 });

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

  const formatMessage = (content: string, isAssistant: boolean) => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      // **bold** and *italic* and `code`
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
      let last = 0;
      let match;
      let key = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        if (match[2]) {
          parts.push(<strong key={key++} className="font-bold">{match[2]}</strong>);
        } else if (match[3]) {
          parts.push(<em key={key++} className="italic">{match[3]}</em>);
        } else if (match[4]) {
          parts.push(
            <code key={key++} className={`px-1.5 py-0.5 rounded text-xs font-mono ${isAssistant ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'}`}>
              {match[4]}
            </code>
          );
        }
        last = match.index + match[0].length;
      }
      if (last < text.length) parts.push(text.slice(last));
      return parts;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Empty line → spacer
      if (line.trim() === '') {
        result.push(<div key={`sp-${i}`} className="h-1" />);
        i++;
        continue;
      }

      // Bullet list: lines starting with - or •
      if (/^[-•]\s/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-•]\s/, ''));
          i++;
        }
        result.push(
          <ul key={`ul-${i}`} className="space-y-1 my-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${isAssistant ? 'bg-primary' : 'bg-white/70'}`} />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list: 1. 2. etc
      if (/^\d+\.\s/.test(line.trim())) {
        const listItems: { num: string; text: string }[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const m = lines[i].trim().match(/^(\d+)\.\s(.+)/);
          if (m) listItems.push({ num: m[1], text: m[2] });
          i++;
        }
        result.push(
          <ol key={`ol-${i}`} className="space-y-1 my-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`font-bold text-xs shrink-0 mt-0.5 ${isAssistant ? 'text-primary' : 'text-white/80'}`}>{item.num}.</span>
                <span>{renderInline(item.text)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Normal line
      result.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return <div className="space-y-0.5">{result}</div>;
  };

  return (
    <section id="demo" className="relative z-10 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className={`text-center mb-10 scroll-reveal ${isVisible ? "visible" : ""}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Habla con ALICIA ahora
          </h2>
          <p className="text-lg text-muted-foreground font-semibold">
            Pregúntale lo que quieras o simula un pedido como lo haría un cliente real
          </p>
        </div>

        {/* Chat container */}
        <div
          ref={sectionRef as React.RefObject<HTMLDivElement>}
          className={`rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl scroll-reveal reveal-delay-2 ${isVisible ? "visible chat-glow-active" : ""}`}
          style={{ boxShadow: "0 0 60px hsl(174 100% 29% / 0.1)" }}
        >
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
                  {formatMessage(msg.content, msg.role === "assistant")}
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
                  className="text-xs px-3 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 touch-feedback"
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
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-primary-foreground shrink-0 touch-feedback"
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
