import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, RotateCcw, Send } from "lucide-react";
import aliciaAvatar from "@/assets/alicia-avatar.png";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";
import burgerImg from "@/assets/vendedores/burger.jpeg";
import friesImg from "@/assets/vendedores/fries.jpeg";
import cocacolaImg from "@/assets/vendedores/cocacola.jpeg";
import tiramisuImg from "@/assets/vendedores/tiramisu.jpeg";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

/* ══════════════════════════════════════════════
   AUDIO TIMESTAMPS — from alicia-intro.mp3
   Used to trigger visual slides (no subtitles)
   ══════════════════════════════════════════════ */
type SlideId = "intro" | "whatsapp" | "ticket" | "gmail" | "summary";

const SLIDE_RANGES: { id: SlideId; start: number; end: number }[] = [
  { id: "intro", start: 0, end: 8 },       // "Hola, soy Alicia..."
  { id: "whatsapp", start: 8, end: 19 },    // "Me conecto al WhatsApp..."
  { id: "ticket", start: 19, end: 54 },     // "+15% ticket promedio" through "sin contratar a nadie"
  { id: "gmail", start: 54, end: 68 },      // "lo envío al correo del dueño"
  { id: "summary", start: 68, end: 999 },   // "Eso soy yo..."
];

// Ticket promedio visual sub-phases
const TICKET_PHASE_NUMBER = 19;    // Show +15% number
const TICKET_PHASE_EXAMPLE = 26;   // Show food order before/after
const TICKET_PHASE_RESULT = 35;    // Show final result

const QUICK_CHIPS = ["¿Cómo gano dinero?", "¿Qué hace exactamente?", "¿Cuánto cuesta?"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
const NodeConoceAlicia = ({ onComplete, onClose }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);

  // +15% count-up
  const [fifteenCount, setFifteenCount] = useState(0);
  const fifteenStarted = useRef(false);

  // Ticket example count-up
  const [orderTotal, setOrderTotal] = useState(42000);
  const orderAnimStarted = useRef(false);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const wasPlayingBeforeChat = useRef(false);

  // WhatsApp chat bubble animation
  const [chatBubbleStep, setChatBubbleStep] = useState(0);

  /* ── HIGH-PRECISION TIME SYNC ── */
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

  /* ── AUDIO SETUP — continuous, no pauses ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => { setIsPlaying(true); startRaf(); };
    const onPause = () => { setIsPlaying(false); stopRaf(); setCurrentTime(audio.currentTime); };
    const onEnded = () => { setAudioEnded(true); setIsPlaying(false); stopRaf(); };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    const t = setTimeout(() => audio.play().catch(() => {}), 1000);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      clearTimeout(t);
      stopRaf();
    };
  }, [startRaf, stopRaf]);

  /* ── +15% count-up animation (19s–21s) ── */
  useEffect(() => {
    if (currentTime >= 19 && !fifteenStarted.current) {
      fifteenStarted.current = true;
      let n = 0;
      const interval = setInterval(() => {
        n += 1;
        setFifteenCount(n);
        if (n >= 15) clearInterval(interval);
      }, 80);
    }
  }, [currentTime]);

  /* ── Order total count-up animation (35s–38s) ── */
  useEffect(() => {
    if (currentTime >= TICKET_PHASE_RESULT && !orderAnimStarted.current) {
      orderAnimStarted.current = true;
      let val = 42000;
      const target = 50000;
      const steps = 35;
      const inc = (target - val) / steps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        val += inc;
        setOrderTotal(Math.round(val / 100) * 100);
        if (step >= steps) {
          setOrderTotal(target);
          clearInterval(interval);
        }
      }, 55);
    }
  }, [currentTime]);

  /* ── WhatsApp chat bubble sequence (8s–19s) ── */
  useEffect(() => {
    if (currentTime >= 10 && currentTime < 19) {
      const elapsed = currentTime - 10;
      if (elapsed >= 6) setChatBubbleStep(4);
      else if (elapsed >= 4) setChatBubbleStep(3);
      else if (elapsed >= 2) setChatBubbleStep(2);
      else if (elapsed >= 0.5) setChatBubbleStep(1);
      else setChatBubbleStep(0);
    } else {
      setChatBubbleStep(0);
    }
  }, [currentTime]);

  /* ── Determine current slide ── */
  const getSlideId = (): SlideId => {
    if (audioEnded) return "summary";
    for (const s of SLIDE_RANGES) {
      if (currentTime >= s.start && currentTime < s.end) return s.id;
    }
    return "summary";
  };

  const slideId = getSlideId();
  const isIntro = slideId === "intro";

  /* ── HANDLERS ── */
  const handleScreenTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, [data-interactive]")) return;
    if (showChat || audioEnded) return;
    if (audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  };

  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setAudioEnded(false);
    setFifteenCount(0);
    fifteenStarted.current = false;
    setOrderTotal(42000);
    orderAnimStarted.current = false;
    setChatBubbleStep(0);
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
    if (wasPlayingBeforeChat.current && !audioEnded) {
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
      {/* ── AUDIO (continuous, no pauses) ── */}
      <audio ref={audioRef} src="/assets/alicia-intro.mp3" preload="auto" />

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
          PERSISTENT ALICIA PHOTO (top center, always visible)
          When intro: LARGE (200px). Otherwise: small (100px).
          ═══════════════════════════════════════════ */}
      <div className="fixed top-10 left-0 right-0 z-30 flex flex-col items-center">
        <motion.div
          className="alicia-photo-wrap"
          animate={{
            width: isIntro ? 200 : 100,
            height: isIntro ? 200 : 100,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 120 }}
        >
          <img src={aliciaAvatar} alt="Alicia" className="alicia-photo" />
        </motion.div>

        {/* Waveform bars */}
        <div className="waveform">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`bar bar-${i} ${isPlaying ? "animate" : ""}`}
            />
          ))}
        </div>

        {/* Name reveal on intro */}
        <AnimatePresence>
          {isIntro && currentTime >= 1.3 && (
            <motion.p
              className="text-white font-bold text-2xl mt-2 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {"Alicia".split("").map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.p>
          )}
        </AnimatePresence>

        {!isIntro && (
          <p className="text-xs text-white/40 mt-1 font-medium tracking-wide">
            Alicia · Conektao
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SLIDE CONTENT AREA
          ═══════════════════════════════════════════ */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 pt-44">
        <AnimatePresence mode="wait">
          {/* ── SLIDE: INTRO ── */}
          {slideId === "intro" && (
            <motion.div key="intro" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Large photo + name handled above */}
            </motion.div>
          )}

          {/* ── SLIDE: WHATSAPP — large logo + live chat bubbles ── */}
          {slideId === "whatsapp" && (
            <motion.div key="whatsapp" className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.img
                src={whatsappLogo}
                alt="WhatsApp"
                className="w-40 h-40"
                initial={{ opacity: 0, x: 60, scale: 0.6 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", damping: 14 }}
              />

              {/* Animated chat bubbles */}
              <div className="w-full max-w-xs space-y-2 mt-2">
                {chatBubbleStep >= 1 && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <div className="bg-[#DCF8C6] text-[#111] text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[75%]">
                      Hola, ¿tienen hamburguesas? 🍔
                    </div>
                  </motion.div>
                )}
                {chatBubbleStep >= 2 && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <div className="bg-white/10 text-white text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[75%]">
                      ¡Hola! Sí, tenemos 5 opciones 😊 ¿Te envío el menú?
                    </div>
                  </motion.div>
                )}
                {chatBubbleStep >= 3 && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <div className="bg-[#DCF8C6] text-[#111] text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[75%]">
                      Sí porfa 🙏
                    </div>
                  </motion.div>
                )}
                {chatBubbleStep >= 4 && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <div className="bg-white/10 text-white text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[75%]">
                      Aquí tienes 👇 ¿Le agrego unas papas? 🍟
                    </div>
                  </motion.div>
                )}
              </div>

              <p className="text-sm font-semibold text-white/60 mt-2">Pedidos 24/7 ✓</p>
            </motion.div>
          )}

          {/* ── SLIDE: TICKET +15% with food order example ── */}
          {slideId === "ticket" && (
            <motion.div key="ticket" className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Big number */}
              <motion.div className="flex flex-col items-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
                <p className="big-number">+{fifteenCount}%</p>
                <p className="text-lg text-white/70 font-semibold mt-1">a +20%</p>
                <p className="text-sm text-white/40 mt-1">Ticket promedio</p>
              </motion.div>

              {/* Food order example — appears at 26s */}
              {currentTime >= TICKET_PHASE_EXAMPLE && (
                <motion.div
                  className="w-full max-w-xs mt-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 16 }}
                >
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                    {/* Food items row */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: currentTime >= TICKET_PHASE_RESULT ? 0.8 : 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                      >
                        <img src={burgerImg} alt="Hamburguesa" className="food-img" />
                        <span className="text-[10px] text-white/50">$28.000</span>
                      </motion.div>
                      <span className="plus-sign">+</span>
                      <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: currentTime >= TICKET_PHASE_RESULT ? 0.8 : 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <img src={friesImg} alt="Papas" className="food-img" />
                        <span className="text-[10px] text-white/50">$7.000</span>
                      </motion.div>
                      <span className="plus-sign">+</span>
                      <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: currentTime >= TICKET_PHASE_RESULT ? 0.8 : 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        <img src={cocacolaImg} alt="Bebida" className="food-img" />
                        <span className="text-[10px] text-white/50">$7.000</span>
                      </motion.div>

                      {/* Postre — slides in after TICKET_PHASE_RESULT */}
                      <AnimatePresence>
                        {currentTime >= TICKET_PHASE_RESULT && (
                          <>
                            <motion.span
                              className="plus-sign"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", damping: 14, delay: 0.2 }}
                            >+</motion.span>
                            <motion.div
                              className="flex flex-col items-center gap-1"
                              initial={{ opacity: 0, x: 40, scale: 0.5 }}
                              animate={{ opacity: 1, x: 0, scale: 0.8 }}
                              transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.3 }}
                            >
                              <img src={tiramisuImg} alt="Postre" className="food-img" />
                              <span className="text-[10px]" style={{ color: "#E8C878" }}>+$8.000</span>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Before / After totals */}
                    <div className="border-t border-white/10 pt-3">
                      {currentTime < TICKET_PHASE_RESULT ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">Total pedido</span>
                          <span className="text-lg font-bold text-white">$42.000</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Chat bubble suggestion — appears first */}
                          <motion.div
                            className="flex items-center justify-center gap-2 mb-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", damping: 14 }}
                          >
                            <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                              💬 "¿Le agrego un postre para terminar bien? 😊"
                            </span>
                          </motion.div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/30 line-through">Sin Alicia</span>
                            <span className="text-sm text-white/30 line-through">$42.000</span>
                          </div>
                          <motion.div
                            className="flex items-center justify-between"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", delay: 0.4 }}
                          >
                            <span className="text-xs font-semibold" style={{ color: "#E8C878" }}>Con Alicia ✨</span>
                            <span className="text-xl font-bold" style={{ color: "#E8C878" }}>
                              ${orderTotal.toLocaleString("es-CO")}
                            </span>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── SLIDE: GMAIL — WhatsApp → arrow → Gmail ── */}
          {slideId === "gmail" && (
            <motion.div key="gmail" className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-6">
                <motion.img
                  src={whatsappLogo}
                  alt="WhatsApp"
                  className="w-16 h-16"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", damping: 14 }}
                />

                {/* Animated arrow with envelope */}
                <div className="relative">
                  <div className="arrow-draw-long" />
                  <motion.span
                    className="absolute top-1/2 left-0 -translate-y-1/2 text-2xl"
                    animate={{ x: [0, 80, 80], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ✉️
                  </motion.span>
                </div>

                <motion.img
                  src={gmailLogo}
                  alt="Gmail"
                  className="w-16 h-16"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, type: "spring", damping: 14 }}
                />
              </div>

              {/* Email preview card */}
              <motion.div
                className="w-full max-w-xs bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3 mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-sm mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Pedido recibido</p>
                    <p className="text-xs text-white/50 mt-0.5">Mesa 3 — $67.000 — 8:42pm</p>
                  </div>
                </div>
              </motion.div>

              <p className="text-sm font-semibold text-white/60 mt-1">Todo organizado, sin errores ✓</p>
            </motion.div>
          )}

          {/* ── SLIDE: SUMMARY / FINAL ── */}
          {slideId === "summary" && audioEnded && (
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

        /* ── Alicia photo — dynamic size via framer-motion ── */
        .alicia-photo-wrap {
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid rgba(201,168,76,0.5);
          box-shadow: 0 0 30px rgba(232,200,120,0.15), 0 0 60px rgba(232,200,120,0.08);
        }
        .alicia-photo { width: 100%; height: 100%; object-fit: contain; }

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
        .arrow-draw { width: 60px; height: 2px; background: linear-gradient(to right, #25D366, #F97316); margin: 12px auto; animation: drawArrow 0.8s ease forwards; transform-origin: left; }
        .arrow-draw-long { width: 100px; height: 2px; background: linear-gradient(to right, #25D366, #F97316); animation: drawArrow 1s ease forwards; transform-origin: left; }
        @keyframes drawArrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* ── Big number ── */
        .big-number { font-size: 72px; font-weight: 900; letter-spacing: -0.04em; background: linear-gradient(135deg, #FFD580 0%, #F97316 60%, #FF6B00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* ── Food row ── */
        .food-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 12px 0; }
        .food-img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); }
        .plus-sign { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #F97316, #E8C878); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
};

export default NodeConoceAlicia;
