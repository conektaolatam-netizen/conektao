import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, RotateCcw, Send } from "lucide-react";
import aliciaAvatar from "@/assets/alicia-avatar.png";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

const SLIDES = [
  { start: 0, end: 7, subtitle: "Hola. Soy Alicia." },
  { start: 7, end: 16, subtitle: "Me conecto a tu WhatsApp" },
  { start: 16, end: 26, subtitle: "Subo el ticket promedio +15%" },
  { start: 26, end: 38, subtitle: "El pedido llega al correo automáticamente" },
  { start: 38, end: 48, subtitle: "Una herramienta. Tres resultados." },
  { start: 48, end: 999, subtitle: "" },
];

const QUICK_CHIPS = ["¿Cómo gano dinero?", "¿Qué hace exactamente?", "¿Cuánto cuesta?"];

const NodeConoceAlicia = ({ onComplete, onClose }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioBlobUrl = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPauseCard, setShowPauseCard] = useState(false);
  const [hasPausedAt26, setHasPausedAt26] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [countUpValue, setCountUpValue] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(true);
  const wasPlayingBeforeChat = useRef(false);

  // Fetch audio on mount
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alicia-tts-intro`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({}),
          }
        );
        if (!res.ok) throw new Error("TTS failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioBlobUrl.current = url;
        const audio = new Audio(url);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          setAudioEnded(true);
          setIsPlaying(false);
          setSubtitleVisible(false);
        });

        audio.addEventListener("canplaythrough", () => {
          setIsLoading(false);
          // Auto-play after 1.5s
          setTimeout(() => {
            audio.play().then(() => setIsPlaying(true)).catch(console.error);
          }, 1500);
        }, { once: true });
      } catch (e) {
        console.error("Audio fetch error:", e);
        setIsLoading(false);
      }
    };
    fetchAudio();
    return () => {
      if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Animation frame loop for sync
  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const t = audio.currentTime;
        const d = audio.duration || 60;
        setProgress(t / d);

        // Determine slide
        for (let i = SLIDES.length - 1; i >= 0; i--) {
          if (t >= SLIDES[i].start) { setCurrentSlide(i); break; }
        }

        // Interactive pause at 26s
        if (t >= 26 && !hasPausedAt26) {
          audio.pause();
          setIsPlaying(false);
          setShowPauseCard(true);
          setHasPausedAt26(true);
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [hasPausedAt26]);

  // Count-up animation for slide 2
  useEffect(() => {
    if (currentSlide === 2) {
      setCountUpValue(0);
      const start = Date.now();
      const dur = 1500;
      const anim = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / dur, 1);
        setCountUpValue(Math.round(p * 15));
        if (p < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }
  }, [currentSlide]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleScreenTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [data-interactive]")) return;
    if (showPauseCard || showChat || isLoading || audioEnded) return;
    togglePlay();
  };

  const resumeAudio = () => {
    setShowPauseCard(false);
    audioRef.current?.play().then(() => setIsPlaying(true));
  };

  const openChatWithQuestion = (q: string) => {
    setShowPauseCard(false);
    setChatMessages([{ role: "user", content: q }]);
    setShowChat(true);
    setShowChips(false);
    wasPlayingBeforeChat.current = false;
    sendChat(q, []);
  };

  const openChat = () => {
    wasPlayingBeforeChat.current = isPlaying;
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    if (wasPlayingBeforeChat.current && !showPauseCard && !audioEnded) {
      audioRef.current?.play().then(() => setIsPlaying(true));
    }
  };

  const sendChat = async (text: string, prevMsgs: ChatMsg[]) => {
    setChatLoading(true);
    try {
      const msgs = [...prevMsgs, { role: "user" as const, content: text }];
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendedor-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: msgs }),
        }
      );
      const data = await res.json();
      setChatMessages((p) => [...p, { role: "assistant", content: data.reply || "..." }]);
    } catch {
      setChatMessages((p) => [...p, { role: "assistant", content: "No pude responder en este momento." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput.trim();
    setChatInput("");
    setShowChips(false);
    setChatMessages((p) => [...p, { role: "user", content: text }]);
    sendChat(text, chatMessages);
  };

  const handleChip = (chip: string) => {
    setShowChips(false);
    setChatMessages((p) => [...p, { role: "user", content: chip }]);
    sendChat(chip, chatMessages);
  };

  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentSlide(0);
    setProgress(0);
    setAudioEnded(false);
    setHasPausedAt26(false);
    setShowPauseCard(false);
    setSubtitleVisible(true);
    audio.play().then(() => setIsPlaying(true));
  };

  const currentSubtitle = SLIDES[currentSlide]?.subtitle || "";

  return (
    <div
      className="relative w-full h-full bg-[#0C0C0C] overflow-hidden select-none"
      onClick={handleScreenTap}
      style={{ touchAction: "manipulation" }}
    >
      {/* Layer 1: Background particles + grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float-particle"
            style={{
              background: i % 3 === 0 ? "hsl(25, 100%, 50%)" : "hsl(43, 60%, 55%)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Progress bar (top) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-white/[0.08]">
        <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Close / Replay buttons */}
      <div className="fixed top-3 right-3 z-50 flex gap-2">
        {audioEnded && (
          <button onClick={replay} data-interactive className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <RotateCcw className="w-4 h-4 text-gray-300" />
          </button>
        )}
        <button onClick={onClose} data-interactive className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <X className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Layer 2: Slide content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
        {/* Small persistent Alicia after slide 0 */}
        {currentSlide > 0 && !audioEnded && (
          <motion.div className="fixed top-4 left-4 z-40" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
            <img src={aliciaAvatar} alt="Alicia" className="w-12 h-12 rounded-full border-2 border-primary/50 object-cover" />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* SLIDE 0 — Alicia intro */}
          {currentSlide === 0 && (
            <motion.div key="s0" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="relative mb-6">
                <img src={aliciaAvatar} alt="Alicia" className="w-[140px] h-[140px] rounded-full object-cover border-2 border-primary/40" />
              </div>
              {/* Equalizer bars */}
              <div className="flex items-end gap-1 h-8 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[6px] rounded-full bg-primary"
                    animate={isLoading ? { height: [8, 14, 8] } : isPlaying ? { height: [8, 24 + Math.random() * 8, 12, 28, 8] } : { height: 8 }}
                    transition={isLoading ? { duration: 1.2, repeat: Infinity, delay: i * 0.15 } : isPlaying ? { duration: 0.6 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.1 } : { duration: 0.3 }}
                  />
                ))}
              </div>
              {isLoading && <p className="text-sm text-muted-foreground animate-pulse">cargando...</p>}
              {!isLoading && (
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-2xl font-bold text-foreground tracking-wide">Alicia</h2>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(201,168,76,0.7)" }}>Asistente IA · Conektao</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* SLIDE 1 — WhatsApp */}
          {currentSlide === 1 && (
            <motion.div key="s1" className="flex items-center justify-center gap-6 w-full max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.img src={whatsappLogo} alt="WhatsApp" className="w-20 h-20 object-contain" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", damping: 15, delay: 0.2 }} />
              <svg width="80" height="4" className="overflow-visible">
                <motion.line x1="0" y1="2" x2="80" y2="2" stroke="#25D366" strokeWidth="3" strokeDasharray="80" initial={{ strokeDashoffset: 80 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.8, delay: 0.5 }} />
              </svg>
              <motion.div className="px-3 py-1.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}>
                <span className="text-xs font-medium text-white">Pedidos 24/7 ✓</span>
              </motion.div>
            </motion.div>
          )}

          {/* SLIDE 2 — +15% */}
          {currentSlide === 2 && !showPauseCard && (
            <motion.div key="s2" className="text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <p className="text-7xl font-extrabold text-foreground mb-3">+{countUpValue}%</p>
              <p className="text-sm" style={{ color: "#E8C878" }}>más ingresos por pedido</p>
            </motion.div>
          )}

          {/* SLIDE 3 — WhatsApp to Gmail */}
          {currentSlide === 3 && (
            <motion.div key="s3" className="flex items-center justify-center gap-4 w-full max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.img src={whatsappLogo} alt="WhatsApp" className="w-16 h-16 object-contain" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 }} />
              <svg width="100" height="20" className="overflow-visible">
                <motion.line x1="0" y1="10" x2="100" y2="10" stroke="hsl(25, 100%, 50%)" strokeWidth="2" strokeDasharray="6 4" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.8, delay: 0.4 }} />
                <motion.text x="50" y="10" textAnchor="middle" dominantBaseline="middle" fontSize="14" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, 50, 100] }} transition={{ duration: 1.5, delay: 0.8 }}>✉️</motion.text>
              </svg>
              <motion.img src={gmailLogo} alt="Gmail" className="w-16 h-16 object-contain" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} />
            </motion.div>
          )}

          {/* SLIDE 4 — Stat cards */}
          {currentSlide === 4 && (
            <motion.div key="s4" className="flex gap-3 w-full max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[
                { big: "24/7", small: "Siempre disponible" },
                { big: "+15%", small: "Ticket promedio" },
                { big: "∞", small: "Sin contratar personal" },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  className="flex-1 text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: i * 0.25 }}
                >
                  <p className="text-2xl font-bold text-primary">{card.big}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{card.small}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* SLIDE 5 — Final */}
          {currentSlide === 5 && (
            <motion.div key="s5" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative mb-6">
                <img src={aliciaAvatar} alt="Alicia" className="w-[140px] h-[140px] rounded-full object-cover" style={{ boxShadow: "0 0 40px rgba(232,200,120,0.3), 0 0 80px rgba(232,200,120,0.1)" }} />
              </div>
              <p className="text-xl font-bold text-foreground mb-8">Ya conoces a Alicia</p>
              {audioEnded && (
                <motion.button
                  data-interactive
                  onClick={onComplete}
                  className="w-full max-w-xs h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  ¡Entendido! Continuar al Pitch →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive pause card */}
      <AnimatePresence>
        {showPauseCard && (
          <motion.div
            className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm p-5 rounded-2xl bg-[#1A1A1A] border border-white/10"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            data-interactive
          >
            <p className="text-foreground font-semibold mb-1">¿Sabes qué es el</p>
            <p className="text-foreground font-semibold mb-4">ticket promedio?</p>
            <div className="flex gap-3">
              <button onClick={resumeAudio} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm">Sí, continúa →</button>
              <button onClick={() => openChatWithQuestion("¿Qué es el ticket promedio?")} className="flex-1 h-11 rounded-xl border border-white/20 text-foreground font-medium text-sm">Explícame 💬</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle bar */}
      {subtitleVisible && currentSubtitle && !showChat && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <motion.div
            key={currentSubtitle}
            className="px-4 py-2 rounded-lg bg-black/70 max-w-[80%]"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[13px] font-medium text-foreground text-center">{currentSubtitle}</p>
          </motion.div>
        </div>
      )}

      {/* Chat button */}
      {!showChat && (
        <button
          data-interactive
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
          style={{ touchAction: "manipulation" }}
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary" />
        </button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-2xl border-t border-white/10"
            style={{ height: "65vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            data-interactive
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={aliciaAvatar} alt="Alicia" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Alicia</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ height: "calc(65vh - 120px)" }}>
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-sm text-muted-foreground animate-pulse">Escribiendo...</div>
                </div>
              )}
            </div>

            {/* Quick chips */}
            {showChips && chatMessages.length === 0 && (
              <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
                {QUICK_CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChip(c)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-primary/40 text-xs text-primary hover:bg-primary/10"
                    style={{ touchAction: "manipulation" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/10">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Pregúntale a Alicia..."
                className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NodeConoceAlicia;
