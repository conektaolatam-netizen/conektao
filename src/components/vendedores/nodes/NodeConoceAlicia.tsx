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

/* ══════════════════════════════════════════════
   SUBTITLES — synced to /assets/alicia-intro.mp3
   Timestamps re-calibrated to actual audio speech
   ══════════════════════════════════════════════ */
const INTRO_SUBS = [
  { start: 0.3, end: 1.2, text: "Hola." },
  { start: 1.3, end: 2.8, text: "Soy Alicia." },
  { start: 3.0, end: 5.5, text: "Trabajo para restaurantes" },
  { start: 5.6, end: 8.0, text: "en Colombia." },
  { start: 8.2, end: 11.0, text: "Las 24 horas del día," },
  { start: 11.1, end: 13.5, text: "los 7 días de la semana." },
  { start: 14.0, end: 16.5, text: "Me conecto directamente" },
  { start: 16.6, end: 19.0, text: "al WhatsApp del restaurante." },
  { start: 19.2, end: 21.5, text: "Ahí recibo pedidos," },
  { start: 21.6, end: 23.5, text: "respondo preguntas" },
  { start: 23.6, end: 26.0, text: "y atiendo clientes," },
  { start: 26.1, end: 29.0, text: "sin que el dueño haga nada." },
  { start: 29.5, end: 32.5, text: "Cada conversación que atiendo" },
  { start: 32.6, end: 35.5, text: "puede aumentar el valor del pedido" },
  { start: 35.6, end: 38.5, text: "hasta un quince por ciento." },
  { start: 39.0, end: 42.5, text: "¿Sabes qué es el ticket promedio?" },
  // After user answers and audio resumes
  { start: 43.0, end: 46.0, text: "Eso significa más dinero" },
  { start: 46.1, end: 48.5, text: "para el restaurante," },
  { start: 48.6, end: 51.0, text: "sin contratar a nadie." },
  { start: 51.5, end: 54.5, text: "Cuando el restaurante recibe un pedido," },
  { start: 54.6, end: 57.5, text: "yo lo organizo y lo envío" },
  { start: 57.6, end: 60.0, text: "automáticamente al correo del dueño." },
  { start: 60.5, end: 63.0, text: "Todo queda registrado," },
  { start: 63.1, end: 65.5, text: "sin errores, sin papeles." },
  { start: 66.0, end: 68.0, text: "Eso soy yo." },
  { start: 68.5, end: 71.0, text: "Una sola herramienta" },
  { start: 71.1, end: 74.0, text: "que conecta WhatsApp con el correo," },
  { start: 74.1, end: 76.0, text: "aumenta las ventas" },
  { start: 76.1, end: 79.0, text: "y trabaja mientras el dueño duerme." },
  { start: 79.5, end: 81.5, text: "Ahora ya me conoces." },
  { start: 82.0, end: 86.0, text: "En el siguiente nivel vas a aprender" },
  { start: 86.1, end: 90.0, text: "cómo presentarme a un restaurante." },
];

/* ── SUBTITLES — ticket promedio audio ── */
const TICKET_SUBS = [
  { start: 0, end: 3, text: "El ticket promedio es el valor promedio" },
  { start: 3, end: 5.5, text: "que gasta cada cliente en un pedido." },
  { start: 5.5, end: 8, text: "Por ejemplo, si diez personas piden" },
  { start: 8, end: 11, text: "y gastan quinientos mil pesos," },
  { start: 11, end: 14, text: "el ticket promedio es cincuenta mil." },
  { start: 14, end: 16, text: "Yo lo subo sugiriendo" },
  { start: 16, end: 18, text: "productos adicionales." },
  { start: 18, end: 20.5, text: "Como cuando piden una hamburguesa" },
  { start: 20.5, end: 22.5, text: "y yo pregunto si quiere papas" },
  { start: 22.5, end: 24, text: "o una bebida." },
  { start: 24, end: 27, text: "Eso sube el total sin esfuerzo." },
];

/* ── FOOD EVENTS (during ticket audio) ── */
const FOOD_EVENTS = [
  { timestamp: 19, word: "hamburguesa", src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop", label: "Hamburguesa" },
  { timestamp: 21.5, word: "papas", src: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=150&h=150&fit=crop", label: "Papas" },
  { timestamp: 23, word: "bebida", src: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=150&h=150&fit=crop", label: "Bebida" },
];

// Pause AFTER Alicia finishes saying "¿Sabes qué es el ticket promedio?"
const PAUSE_TIMESTAMP = 42.5;
const QUESTION_START = 39.0;
const QUICK_CHIPS = ["¿Cómo gano dinero?", "¿Qué hace exactamente?", "¿Cuánto cuesta?"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ══════════════════════════════════════════════
   SLIDE DEFINITIONS — time-based, always used
   ══════════════════════════════════════════════ */
type SlideId = "intro" | "whatsapp" | "ticket" | "question" | "transition" | "gmail" | "summary";

const SLIDE_RANGES: { id: SlideId; start: number; end: number }[] = [
  { id: "intro", start: 0, end: 8 },
  { id: "whatsapp", start: 8, end: 19 },
  { id: "ticket", start: 19, end: 39 },
  // question is handled by showPauseCard state, not time-based
  { id: "transition", start: 43, end: 54 },
  { id: "gmail", start: 54, end: 68 },
  { id: "summary", start: 68, end: 999 },
];

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
const NodeConoceAlicia = ({ onComplete, onClose }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ticketAudioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const ticketRafRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [hasPausedAtQuestion, setHasPausedAtQuestion] = useState(false);
  const [showPauseCard, setShowPauseCard] = useState(false);
  const [afterQuestion, setAfterQuestion] = useState(false);

  // Ticket explainer (Path B)
  const [showTicketExplainer, setShowTicketExplainer] = useState(false);
  const [ticketPlaying, setTicketPlaying] = useState(false);
  const [ticketTime, setTicketTime] = useState(0);
  const [ticketCountValue, setTicketCountValue] = useState(50000);
  const [showTicketContinue, setShowTicketContinue] = useState(false);
  const [visibleFoods, setVisibleFoods] = useState<typeof FOOD_EVENTS>([]);

  // Inactivity nudge
  const [buttonsGlow, setButtonsGlow] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const wasPlayingBeforeChat = useRef(false);

  // +15% count-up for ticket slide
  const [fifteenCount, setFifteenCount] = useState(0);
  const fifteenStarted = useRef(false);

  /* ── HIGH-PRECISION TIME SYNC via requestAnimationFrame ── */
  const startRaf = useCallback(() => {
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startTicketRaf = useCallback(() => {
    const tick = () => {
      if (ticketAudioRef.current && !ticketAudioRef.current.paused) {
        setTicketTime(ticketAudioRef.current.currentTime);
      }
      ticketRafRef.current = requestAnimationFrame(tick);
    };
    ticketRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTicketRaf = useCallback(() => {
    if (ticketRafRef.current) {
      cancelAnimationFrame(ticketRafRef.current);
      ticketRafRef.current = null;
    }
  }, []);

  /* ── AUDIO SETUP ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => { setIsPlaying(true); startRaf(); };
    const onPause = () => { setIsPlaying(false); stopRaf(); setCurrentTime(audio.currentTime); };
    const onEnded = () => { setAudioEnded(true); setIsPlaying(false); stopRaf(); };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    // Auto-play after 1s
    const t = setTimeout(() => audio.play().catch(() => {}), 1000);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      clearTimeout(t);
      stopRaf();
    };
  }, [startRaf, stopRaf]);

  /* ── TICKET AUDIO SETUP ── */
  useEffect(() => {
    const ta = ticketAudioRef.current;
    if (!ta) return;

    const onPlay = () => { setTicketPlaying(true); startTicketRaf(); };
    const onPause = () => { setTicketPlaying(false); stopTicketRaf(); };
    const onEnded = () => {
      setTicketPlaying(false);
      stopTicketRaf();
      setShowTicketContinue(true);
    };

    ta.addEventListener("play", onPlay);
    ta.addEventListener("pause", onPause);
    ta.addEventListener("ended", onEnded);

    return () => {
      ta.removeEventListener("play", onPlay);
      ta.removeEventListener("pause", onPause);
      ta.removeEventListener("ended", onEnded);
      stopTicketRaf();
    };
  }, [startTicketRaf, stopTicketRaf]);

  /* ── PAUSE at question timestamp ── */
  useEffect(() => {
    if (currentTime >= PAUSE_TIMESTAMP && !hasPausedAtQuestion && !afterQuestion) {
      audioRef.current?.pause();
      setShowPauseCard(true);
      setHasPausedAtQuestion(true);

      // 15s nudge
      pauseTimerRef.current = setTimeout(() => {
        setButtonsGlow(true);
        setNudgeVisible(true);
      }, 15000);

      // 30s replay question audio
      replayTimerRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = QUESTION_START;
          audioRef.current.play().catch(() => {});
          setTimeout(() => {
            audioRef.current?.pause();
          }, 4000);
        }
      }, 30000);
    }
  }, [currentTime, hasPausedAtQuestion, afterQuestion]);

  /* ── +15% count-up on ticket slide ── */
  useEffect(() => {
    if (currentTime >= 19 && currentTime < 39 && !fifteenStarted.current) {
      fifteenStarted.current = true;
      let n = 0;
      const interval = setInterval(() => {
        n += 1;
        setFifteenCount(n);
        if (n >= 15) clearInterval(interval);
      }, 80);
    }
  }, [currentTime]);

  /* ── Ticket audio: food images + count-up ── */
  useEffect(() => {
    if (!showTicketExplainer) return;

    // Food images
    const visible = FOOD_EVENTS.filter(
      (f) => ticketTime >= f.timestamp && ticketTime < f.timestamp + 4
    );
    setVisibleFoods(visible);

    // Count-up 50k → 57.5k between 11s-14s
    if (ticketTime >= 11 && ticketTime <= 14) {
      const p = Math.min((ticketTime - 11) / 3, 1);
      setTicketCountValue(Math.round(50000 + p * 7500));
    }
  }, [ticketTime, showTicketExplainer]);

  /* ── Get current subtitle ── */
  const getSub = (subs: typeof INTRO_SUBS, time: number) =>
    subs.find((s) => time >= s.start && time < s.end)?.text || "";

  const introSub = getSub(INTRO_SUBS, currentTime);
  const ticketSub = getSub(TICKET_SUBS, ticketTime);
  const activeSub = showTicketExplainer ? ticketSub : introSub;

  /* ── Determine current slide — ALWAYS time-based ── */
  const getSlideId = (): SlideId => {
    if (showTicketExplainer) return "question"; // Path B overlay
    if (audioEnded) return "summary";
    if (showPauseCard) return "question";
    // Use time-based slide routing for ALL states (including afterQuestion)
    for (const s of SLIDE_RANGES) {
      if (currentTime >= s.start && currentTime < s.end) return s.id;
    }
    return "summary";
  };

  const slideId = getSlideId();

  /* ── HANDLERS ── */
  const clearPauseTimers = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setNudgeVisible(false);
    setButtonsGlow(false);
  };

  const handleYes = () => {
    clearPauseTimers();
    setShowPauseCard(false);
    setAfterQuestion(true);
    // Resume from exactly where we paused — no jumping
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleNo = () => {
    clearPauseTimers();
    setShowPauseCard(false);
    setShowTicketExplainer(true);
    setTicketCountValue(50000);
    setShowTicketContinue(false);
    setVisibleFoods([]);
    ticketAudioRef.current?.play().catch(() => {});
  };

  const handleTicketContinue = () => {
    setShowTicketExplainer(false);
    setShowTicketContinue(false);
    setVisibleFoods([]);
    // Stop ticket audio cleanly
    if (ticketAudioRef.current) {
      ticketAudioRef.current.pause();
      ticketAudioRef.current.currentTime = 0;
    }
    setAfterQuestion(true);
    // Resume main audio from where it paused
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleScreenTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [data-interactive]")) return;
    if (showPauseCard || showChat || audioEnded || showTicketExplainer) return;
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setAudioEnded(false);
    setHasPausedAtQuestion(false);
    setShowPauseCard(false);
    setShowTicketExplainer(false);
    setAfterQuestion(false);
    setFifteenCount(0);
    fifteenStarted.current = false;
    audio.play().catch(() => {});
  };

  /* ── CHAT ── */
  const openChat = () => {
    wasPlayingBeforeChat.current = isPlaying;
    if (isPlaying) audioRef.current?.pause();
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    if (wasPlayingBeforeChat.current && !showPauseCard && !audioEnded) {
      audioRef.current?.play().catch(() => {});
    }
  };

  const sendChat = async (text: string) => {
    setChatLoading(true);
    try {
      const msgs = [...chatMessages, { role: "user" as const, content: text }];
      const res = await fetch(`${SUPABASE_URL}/functions/v1/vendedor-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ messages: msgs }),
      });
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
    sendChat(text);
  };

  const handleChip = (chip: string) => {
    setShowChips(false);
    setChatMessages((p) => [...p, { role: "user", content: chip }]);
    sendChat(chip);
  };

  /* ── Progress ── */
  const duration = audioRef.current?.duration || 90;
  const progress = duration > 0 ? currentTime / duration : 0;

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onClick={handleScreenTap}
      style={{ touchAction: "manipulation", background: "#000000" }}
    >
      {/* ── AUDIO ELEMENTS (static files) ── */}
      <audio ref={audioRef} src="/assets/alicia-intro.mp3" preload="auto" />
      <audio ref={ticketAudioRef} src="/assets/alicia-ticket-promedio.mp3" preload="auto" />

      {/* ── BACKGROUND ORBS ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── PROGRESS BAR ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full transition-[width] duration-200" style={{ width: `${progress * 100}%`, background: "linear-gradient(135deg, #FF9A3C, #F97316, #E8C878)" }} />
      </div>

      {/* ── CLOSE / REPLAY ── */}
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

      {/* ═══════════════════════════════════════════
          CAPA 1 — ALICIA PHOTO + WAVEFORM (always visible)
          ═══════════════════════════════════════════ */}
      <div className="fixed top-12 left-0 right-0 z-30 flex flex-col items-center">
        <div className="alicia-photo-wrap">
          <img src={aliciaAvatar} alt="Alicia" className="alicia-photo" />
        </div>

        {/* Waveform bars */}
        <div className="waveform">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`bar bar-${i} ${isPlaying || ticketPlaying ? "animate" : ""}`}
            />
          ))}
        </div>

        <p className="text-xs text-white/40 mt-1.5 font-medium tracking-wide">
          Alicia · Conektao
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          CAPA 3 — SLIDE CONTENT AREA
          ═══════════════════════════════════════════ */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 pt-44">
        <AnimatePresence mode="wait">
          {/* ── SLIDE: INTRO ── */}
          {slideId === "intro" && !showTicketExplainer && (
            <motion.div key="intro" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Just photo + waveform above, no extra content */}
            </motion.div>
          )}

          {/* ── SLIDE: WHATSAPP ── */}
          {slideId === "whatsapp" && !showTicketExplainer && (
            <motion.div key="whatsapp" className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <img src={whatsappLogo} alt="WhatsApp" className="w-16 h-16 logo-animate" />
              <div className="arrow-draw" />
              <p className="text-sm font-semibold text-white/80">Pedidos 24/7 ✓</p>
            </motion.div>
          )}

          {/* ── SLIDE: TICKET +15% ── */}
          {slideId === "ticket" && !showTicketExplainer && !showPauseCard && (
            <motion.div key="ticket" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="big-number">+{fifteenCount}%</p>
              <p className="text-sm text-white/50 mt-1 font-medium">más ingresos por pedido</p>
            </motion.div>
          )}

          {/* ── SLIDE: TRANSITION (after question, before gmail) ── */}
          {slideId === "transition" && !showTicketExplainer && !showPauseCard && (
            <motion.div key="transition" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="big-number text-5xl">+15%</p>
              <p className="text-sm text-white/50 mt-1 font-medium">más dinero para el restaurante</p>
            </motion.div>
          )}

          {/* ── SLIDE: TICKET EXPLAINER (Path B) ── */}
          {showTicketExplainer && (
            <motion.div key="explainer" className="flex flex-col items-center text-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center gap-2">
                <p className="text-base font-medium text-white/60">Ticket promedio</p>
                <p className="big-number text-5xl">${ticketCountValue.toLocaleString("es-CO")}</p>
                {ticketCountValue > 50000 && (
                  <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="text-xl">↑</span>
                    <span className="text-xl font-bold plus-sign">+15%</span>
                  </motion.div>
                )}
              </div>

              {/* Food images row */}
              {visibleFoods.length > 0 && (
                <div className="food-row">
                  {visibleFoods.map((f, i) => (
                    <React.Fragment key={f.word}>
                      {i > 0 && <span className="plus-sign">+</span>}
                      <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, scale: 0.6, x: 30 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ type: "spring", damping: 12 }}
                      >
                        <img src={f.src} alt={f.label} className="food-img" />
                        <span className="text-[10px] text-white/50">{f.label}</span>
                      </motion.div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {showTicketContinue && (
                <motion.button
                  data-interactive
                  onClick={handleTicketContinue}
                  className="mt-4 px-8 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring" }}
                >
                  Entendido, continuar →
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── SLIDE: GMAIL ── */}
          {slideId === "gmail" && !showTicketExplainer && !showPauseCard && (
            <motion.div key="gmail" className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative flex items-center gap-4">
                <img src={gmailLogo} alt="Gmail" className="w-14 h-14 logo-animate" />
                <motion.span
                  className="text-2xl"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  ✉️
                </motion.span>
              </div>
              <div className="arrow-draw" />
              <p className="text-sm font-semibold text-white/80">Pedido enviado al correo ✓</p>
            </motion.div>
          )}

          {/* ── SLIDE: SUMMARY / FINAL ── */}
          {slideId === "summary" && audioEnded && !showTicketExplainer && (
            <motion.div key="summary" className="flex flex-col items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xl font-bold text-white">Ya conoces a Alicia</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════
          PAUSE CARD — branching question
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showPauseCard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-interactive
          >
            <motion.div
              className="w-full max-w-sm p-6 rounded-2xl bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10"
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 18 }}
            >
              <p className="text-white font-semibold text-lg mb-1">¿Sabes qué es el</p>
              <p className="font-bold text-lg mb-6 plus-sign" style={{ fontSize: 18, WebkitTextFillColor: "transparent" }}>
                ticket promedio?
              </p>

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={handleYes}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
                  animate={buttonsGlow ? { boxShadow: ["0 0 0px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.5)", "0 0 0px rgba(249,115,22,0)"] } : {}}
                  transition={buttonsGlow ? { duration: 2, repeat: Infinity } : {}}
                >
                  Sí, continúa →
                </motion.button>
                <motion.button
                  onClick={handleNo}
                  className="w-full h-12 rounded-xl border border-white/20 text-white font-medium text-sm hover:bg-white/5 transition-colors"
                  animate={buttonsGlow ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.15)", "0 0 0px rgba(255,255,255,0)"] } : {}}
                  transition={buttonsGlow ? { duration: 2, repeat: Infinity } : {}}
                >
                  No, explícame
                </motion.button>
              </div>

              <AnimatePresence>
                {nudgeVisible && (
                  <motion.p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ¿Sigues ahí? Por favor elige una opción 👆
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          SUBTITLE BAR
          ═══════════════════════════════════════════ */}
      {activeSub && !showChat && !showPauseCard && !audioEnded && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <motion.div
            key={activeSub}
            className="subtitle-bar"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm font-medium text-center text-white">{activeSub}</p>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAT BUTTON
          ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════
          CHAT PANEL
          ═══════════════════════════════════════════ */}
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={aliciaAvatar} alt="Alicia" className="w-8 h-8 rounded-full object-contain" />
                <div>
                  <p className="text-sm font-semibold text-white">Alicia</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] text-white/50">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ height: "calc(65vh - 120px)" }}>
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white/10 text-white"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-sm text-white/50 animate-pulse">Escribiendo...</div>
                </div>
              )}
            </div>

            {showChips && chatMessages.length === 0 && (
              <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
                {QUICK_CHIPS.map((c) => (
                  <button key={c} onClick={() => handleChip(c)} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-primary/40 text-xs text-primary hover:bg-primary/10" style={{ touchAction: "manipulation" }}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 px-4 py-3 border-t border-white/10">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Pregúntale a Alicia..."
                className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-primary/50"
              />
              <button onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          SCOPED CSS
          ═══════════════════════════════════════════ */}
      <style>{`
        /* ── Orbs ── */
        .orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(249,115,22,0.10), transparent 70%); top: -150px; left: -100px; animation: orbFloat1 20s ease-in-out infinite; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%); bottom: -100px; right: -80px; animation: orbFloat2 26s ease-in-out infinite; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,160,60,0.06), transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation: orbFloat3 22s ease-in-out infinite; }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(50px,-30px)} 66%{transform:translate(-20px,40px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-40px,20px)} 66%{transform:translate(30px,-50px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-45%,-55%)} }

        /* ── Alicia photo ── */
        .alicia-photo-wrap { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(201,168,76,0.4); }
        .alicia-photo { width: 100%; height: 100%; object-fit: cover; object-position: center top; }

        /* ── Waveform ── */
        .waveform { display: flex; align-items: center; gap: 4px; margin-top: 10px; height: 28px; }
        .bar { width: 3px; border-radius: 3px; background: linear-gradient(to top, #F97316, #E8C878); height: 8px; transition: height 0.15s ease; }
        .bar.animate { animation: wave var(--duration) ease-in-out infinite alternate; }
        .bar-1 { --duration: 0.5s; }
        .bar-2 { --duration: 0.7s; }
        .bar-3 { --duration: 0.4s; }
        .bar-4 { --duration: 0.6s; }
        .bar-5 { --duration: 0.45s; }
        @keyframes wave { from { height: 6px; } to { height: 28px; } }

        /* ── Slides ── */
        .logo-animate { animation: springIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes springIn { from { opacity: 0; transform: scale(0.5) translateX(40px); } to { opacity: 1; transform: scale(1) translateX(0); } }
        .arrow-draw { width: 60px; height: 2px; background: linear-gradient(to right, #25D366, #F97316); margin: 12px auto; animation: drawArrow 0.8s ease forwards; transform-origin: left; }
        @keyframes drawArrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* ── Big number ── */
        .big-number { font-size: 72px; font-weight: 900; letter-spacing: -0.04em; background: linear-gradient(135deg, #FFD580 0%, #F97316 60%, #FF6B00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* ── Food row ── */
        .food-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 12px 0; }
        .food-img { width: 90px; height: 90px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); animation: springIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .plus-sign { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #F97316, #E8C878); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        /* ── Subtitle ── */
        .subtitle-bar { background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 20px; max-width: 85%; text-align: center; }

        /* ── Nudge pulse ── */
        .pulse-glow { animation: pulseGlow 1s ease-in-out infinite; }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 rgba(249,115,22,0); } 50% { box-shadow: 0 0 20px rgba(249,115,22,0.5); } }
      `}</style>
    </div>
  );
};

export default NodeConoceAlicia;
