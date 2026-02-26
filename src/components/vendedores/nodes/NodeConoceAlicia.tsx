import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, RotateCcw, Send } from "lucide-react";
import aliciaAvatar from "@/assets/alicia-avatar.png";

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

/* ── SUBTITLES — synced to intro audio (estimated ~52s) ── */
const INTRO_SUBS = [
  { start: 0, end: 1.5, text: "Hola." },
  { start: 1.5, end: 3, text: "Soy Alicia." },
  { start: 3, end: 6, text: "Trabajo para restaurantes" },
  { start: 6, end: 8, text: "en Colombia" },
  { start: 8, end: 10.5, text: "las 24 horas del día," },
  { start: 10.5, end: 13, text: "los 7 días de la semana." },
  { start: 13, end: 16, text: "Me conecto directamente" },
  { start: 16, end: 18, text: "al WhatsApp del restaurante." },
  { start: 18, end: 20, text: "Ahí recibo pedidos," },
  { start: 20, end: 22, text: "respondo preguntas" },
  { start: 22, end: 24.5, text: "y atiendo clientes," },
  { start: 24.5, end: 27, text: "sin que el dueño tenga que hacer nada." },
  { start: 27, end: 30, text: "Cada conversación que atiendo" },
  { start: 30, end: 33, text: "puede aumentar el valor de cada pedido" },
  { start: 33, end: 36, text: "hasta un quince por ciento." },
  { start: 36, end: 39, text: "¿Sabes qué es el ticket promedio?" }, // ← PAUSE HERE
  // After resume from pause (timestamps continue from ~39s)
  { start: 39, end: 42, text: "Eso significa más dinero" },
  { start: 42, end: 44, text: "para el restaurante," },
  { start: 44, end: 46, text: "sin contratar a nadie." },
  { start: 46, end: 49, text: "Y cuando el restaurante recibe un pedido," },
  { start: 49, end: 52, text: "yo lo organizo y lo envío" },
  { start: 52, end: 54, text: "automáticamente al correo del dueño." },
  { start: 54, end: 57, text: "Todo queda registrado," },
  { start: 57, end: 59, text: "sin errores, sin papeles." },
  { start: 59, end: 61, text: "Eso soy yo." },
  { start: 61, end: 64, text: "Una sola herramienta" },
  { start: 64, end: 67, text: "que conecta WhatsApp con el correo," },
  { start: 67, end: 69, text: "aumenta las ventas" },
  { start: 69, end: 72, text: "y trabaja mientras el dueño duerme." },
  { start: 72, end: 74, text: "Ahora ya me conoces." },
  { start: 74, end: 78, text: "En el siguiente nivel vas a aprender" },
  { start: 78, end: 82, text: "cómo presentarme a un restaurante." },
];

/* ── SUBTITLES — ticket promedio audio (~22s) ── */
const TICKET_SUBS = [
  { start: 0, end: 3, text: "El ticket promedio es el valor promedio" },
  { start: 3, end: 5.5, text: "que gasta cada cliente en un pedido." },
  { start: 5.5, end: 8, text: "Por ejemplo, si diez personas piden" },
  { start: 8, end: 11, text: "y en total gastan quinientos mil pesos," },
  { start: 11, end: 14, text: "el ticket promedio es cincuenta mil pesos." },
  { start: 14, end: 16, text: "Yo lo subo sugiriendo" },
  { start: 16, end: 18, text: "productos adicionales en cada conversación." },
  { start: 18, end: 20.5, text: "Como cuando una persona pide una hamburguesa" },
  { start: 20.5, end: 22.5, text: "y yo le pregunto si quiere papas" },
  { start: 22.5, end: 24, text: "o una bebida." },
  { start: 24, end: 27, text: "Eso sube el total sin que el dueño haga nada." },
];

/* ── FOOD IMAGE EVENTS (during ticket audio) ── */
const FOOD_EVENTS = [
  { timestamp: 19, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200", label: "Hamburguesa" },
  { timestamp: 21.5, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200", label: "Papas" },
  { timestamp: 23, image: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=200", label: "Bebida" },
];

const PAUSE_TIMESTAMP = 39; // second when "¿Sabes qué es el ticket promedio?" finishes
const QUICK_CHIPS = ["¿Cómo gano dinero?", "¿Qué hace exactamente?", "¿Cuánto cuesta?"];

const GRADIENT_ORANGE = "linear-gradient(135deg, #FF9A3C 0%, #F97316 50%, #E8C878 100%)";
const GRADIENT_SUBTITLE = "linear-gradient(90deg, #FFFFFF 0%, #FFD580 100%)";
const GRADIENT_FIFTEEN = "linear-gradient(135deg, #FFD580 0%, #F97316 60%, #FF6B00 100%)";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const NodeConoceAlicia = ({ onComplete, onClose }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ticketAudioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const introBlob = useRef<string | null>(null);
  const ticketBlob = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPauseCard, setShowPauseCard] = useState(false);
  const [hasPausedAtQuestion, setHasPausedAtQuestion] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [showTicketExplainer, setShowTicketExplainer] = useState(false);
  const [ticketPlaying, setTicketPlaying] = useState(false);
  const [ticketTime, setTicketTime] = useState(0);
  const [ticketCountValue, setTicketCountValue] = useState(50000);
  const [showTicketContinue, setShowTicketContinue] = useState(false);
  const [visibleFoods, setVisibleFoods] = useState<typeof FOOD_EVENTS>([]);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [buttonsGlow, setButtonsGlow] = useState(false);
  const wasPlayingBeforeChat = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch audio from edge functions ──
  useEffect(() => {
    const fetchAudio = async (fnName: string): Promise<string> => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`${fnName} failed: ${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    };

    const load = async () => {
      try {
        const [introUrl, ticketUrl] = await Promise.all([
          fetchAudio("alicia-tts-intro"),
          fetchAudio("alicia-tts-ticket"),
        ]);
        introBlob.current = introUrl;
        ticketBlob.current = ticketUrl;

        const audio = new Audio(introUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        const tAudio = new Audio(ticketUrl);
        tAudio.preload = "auto";
        ticketAudioRef.current = tAudio;

        audio.addEventListener("ended", () => {
          setAudioEnded(true);
          setIsPlaying(false);
        });

        tAudio.addEventListener("ended", () => {
          setTicketPlaying(false);
          setShowTicketContinue(true);
        });

        audio.addEventListener("canplaythrough", () => {
          setIsLoading(false);
          setTimeout(() => {
            audio.play().then(() => setIsPlaying(true)).catch(console.error);
          }, 800);
        }, { once: true });
      } catch (err) {
        console.error("Audio load error:", err);
        setLoadError(true);
        setIsLoading(false);
      }
    };

    load();

    return () => {
      audioRef.current?.pause();
      ticketAudioRef.current?.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (introBlob.current) URL.revokeObjectURL(introBlob.current);
      if (ticketBlob.current) URL.revokeObjectURL(ticketBlob.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, []);

  // ── Sync loop for intro audio ──
  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const t = audio.currentTime;
        const d = audio.duration || 80;
        setProgress(t / d);
        setCurrentTime(t);

        // Pause at question timestamp
        if (t >= PAUSE_TIMESTAMP && !hasPausedAtQuestion) {
          audio.pause();
          setIsPlaying(false);
          setShowPauseCard(true);
          setHasPausedAtQuestion(true);

          // Inactivity: glow at 15s, nudge text at 15s, replay at 30s
          pauseTimerRef.current = setTimeout(() => {
            setButtonsGlow(true);
            setNudgeVisible(true);
          }, 15000);
          replayTimerRef.current = setTimeout(() => {
            // Replay the question
            if (audioRef.current) {
              audioRef.current.currentTime = PAUSE_TIMESTAMP - 4;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setTimeout(() => {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                }, 4500);
              });
            }
          }, 30000);
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [hasPausedAtQuestion]);

  // ── Sync loop for ticket audio (food images + count-up) ──
  useEffect(() => {
    if (!showTicketExplainer) return;
    let frame: number;
    const tick = () => {
      const ta = ticketAudioRef.current;
      if (ta && !ta.paused) {
        const t = ta.currentTime;
        setTicketTime(t);

        // Food images
        const visible = FOOD_EVENTS.filter((f) => t >= f.timestamp && t < f.timestamp + 5);
        setVisibleFoods(visible);

        // Count-up from 50k to 57.5k between 11s and 14s
        if (t >= 11 && t <= 14) {
          const p = Math.min((t - 11) / 3, 1);
          setTicketCountValue(Math.round(50000 + p * 7500));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [showTicketExplainer]);

  // ── Get current subtitle ──
  const getSubtitle = (subs: typeof INTRO_SUBS, time: number) => {
    const s = subs.find((s) => time >= s.start && time < s.end);
    return s?.text || "";
  };

  const introSubtitle = getSubtitle(INTRO_SUBS, currentTime);
  const ticketSubtitle = getSubtitle(TICKET_SUBS, ticketTime);
  const activeSubtitle = showTicketExplainer ? ticketSubtitle : introSubtitle;

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
    if (showPauseCard || showChat || isLoading || audioEnded || showTicketExplainer) return;
    togglePlay();
  };

  const clearPauseTimers = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setNudgeVisible(false);
    setButtonsGlow(false);
  };

  const resumeAudio = () => {
    clearPauseTimers();
    setShowPauseCard(false);
    audioRef.current?.play().then(() => setIsPlaying(true));
  };

  const handleExplainTicket = () => {
    clearPauseTimers();
    setShowPauseCard(false);
    setShowTicketExplainer(true);
    setTicketPlaying(true);
    setTicketCountValue(50000);
    setShowTicketContinue(false);
    setVisibleFoods([]);
    ticketAudioRef.current?.play().catch(console.error);
  };

  const handleTicketContinue = () => {
    setShowTicketExplainer(false);
    setShowTicketContinue(false);
    setTicketPlaying(false);
    setVisibleFoods([]);
    ticketAudioRef.current?.pause();
    if (ticketAudioRef.current) ticketAudioRef.current.currentTime = 0;
    audioRef.current?.play().then(() => setIsPlaying(true));
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
    setProgress(0);
    setCurrentTime(0);
    setAudioEnded(false);
    setHasPausedAtQuestion(false);
    setShowPauseCard(false);
    setShowTicketExplainer(false);
    audio.play().then(() => setIsPlaying(true));
  };

  // ── Waveform bar heights ──
  const barAnimations = [0, 1, 2, 3, 4].map((i) => ({
    duration: 0.4 + i * 0.1,
    delay: i * 0.08,
  }));

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onClick={handleScreenTap}
      style={{ touchAction: "manipulation", background: "#000000" }}
    >
      {/* ── FIX 6: Atmospheric orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div className="h-full" style={{ width: `${progress * 100}%`, background: GRADIENT_ORANGE }} />
      </div>

      {/* ── Close / Replay ── */}
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

      {/* ── FIX 3: Always-visible Alicia photo + waveform ── */}
      <div className="fixed top-12 left-0 right-0 z-30 flex flex-col items-center">
        <img
          src={aliciaAvatar}
          alt="Alicia"
          className="rounded-full border-2 border-primary/40"
          style={{ width: 90, height: 90, objectFit: "contain", objectPosition: "center" }}
        />
        {/* Waveform bars */}
        <div className="flex items-end gap-1 mt-2" style={{ height: 28 }}>
          {barAnimations.map((b, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 3, background: GRADIENT_ORANGE }}
              animate={
                (isPlaying || ticketPlaying)
                  ? { height: [8, 20 + Math.random() * 8, 10, 28, 8] }
                  : { height: 8 }
              }
              transition={
                (isPlaying || ticketPlaying)
                  ? { duration: b.duration, repeat: Infinity, delay: b.delay }
                  : { duration: 0.3 }
              }
            />
          ))}
        </div>
        {isLoading && <p className="text-xs text-white/40 mt-2 animate-pulse">Cargando audio...</p>}
        {loadError && <p className="text-xs text-red-400 mt-2">Error al cargar audio</p>}
      </div>

      {/* ── Main content area ── */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 pt-40">
        <AnimatePresence mode="wait">
          {/* ── Ticket Promedio Explainer (Path B) ── */}
          {showTicketExplainer && (
            <motion.div key="ticket" className="flex flex-col items-center text-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Animated ticket value */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-base font-medium text-white/60">Ticket promedio</p>
                <p className="text-5xl font-black tabular-nums" style={{ background: GRADIENT_FIFTEEN, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.04em" }}>
                  ${ticketCountValue.toLocaleString("es-CO")}
                </p>
                {ticketCountValue > 50000 && (
                  <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="text-xl">↑</span>
                    <span className="text-xl font-bold" style={{ background: GRADIENT_ORANGE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>+15%</span>
                  </motion.div>
                )}
              </div>

              {/* ── FIX 4: Food images row ── */}
              {visibleFoods.length > 0 && (
                <div className="food-image-row">
                  {visibleFoods.map((f, i) => (
                    <React.Fragment key={f.label}>
                      {i > 0 && <span className="plus-sign">+</span>}
                      <motion.div className="flex flex-col items-center gap-1" initial={{ opacity: 0, scale: 0.6, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ type: "spring", damping: 12 }}>
                        <img src={f.image} alt={f.label} className="food-image" />
                        <span className="text-[10px] text-white/50">{f.label}</span>
                      </motion.div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Continue button */}
              {showTicketContinue && (
                <motion.button data-interactive onClick={handleTicketContinue} className="mt-4 px-8 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }}>
                  Entendido, continuar →
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── Final screen ── */}
          {audioEnded && !showTicketExplainer && (
            <motion.div key="final" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xl font-bold text-white mb-8">Ya conoces a Alicia</p>
              <motion.button data-interactive onClick={onComplete} className="w-full max-w-xs h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}>
                ¡Entendido! Continuar al Pitch →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FIX 5: Pause card with synced question ── */}
      <AnimatePresence>
        {showPauseCard && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-interactive>
            <motion.div className="w-full max-w-sm p-6 rounded-2xl bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10" initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 40 }} transition={{ type: "spring", damping: 18 }}>
              <p className="text-white font-semibold text-lg mb-1">¿Sabes qué es el</p>
              <p className="font-bold text-lg mb-6" style={{ background: GRADIENT_ORANGE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ticket promedio?</p>
              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={resumeAudio}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
                  animate={buttonsGlow ? { boxShadow: ["0 0 0px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.5)", "0 0 0px rgba(249,115,22,0)"] } : {}}
                  transition={buttonsGlow ? { duration: 2, repeat: Infinity } : {}}
                >
                  Sí, continúa →
                </motion.button>
                <motion.button
                  onClick={handleExplainTicket}
                  className="w-full h-12 rounded-xl border border-white/20 text-white font-medium text-sm hover:bg-white/5 transition-colors"
                  animate={buttonsGlow ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.15)", "0 0 0px rgba(255,255,255,0)"] } : {}}
                  transition={buttonsGlow ? { duration: 2, repeat: Infinity } : {}}
                >
                  No, explícame
                </motion.button>
              </div>
              {/* Nudge text */}
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

      {/* ── FIX 2: Subtitle bar ── */}
      {activeSubtitle && !showChat && !showPauseCard && !audioEnded && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <motion.div
            key={activeSubtitle}
            className="px-[18px] py-2 rounded-[20px] max-w-[85%]"
            style={{ background: "rgba(0,0,0,0.75)" }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm font-medium text-center" style={{ background: GRADIENT_SUBTITLE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {activeSubtitle}
            </p>
          </motion.div>
        </div>
      )}

      {/* ── Chat button ── */}
      {!showChat && (
        <button data-interactive onClick={openChat} className="fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30" style={{ touchAction: "manipulation" }}>
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary" />
        </button>
      )}

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {showChat && (
          <motion.div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-2xl border-t border-white/10" style={{ height: "65vh" }} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} data-interactive>
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
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChatSend()} placeholder="Pregúntale a Alicia..." className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-primary/50" />
              <button onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50">
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scoped CSS ── */}
      <style>{`
        .orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(249,115,22,0.10), transparent 70%);
          filter: blur(90px);
          top: -150px; left: -100px;
          animation: orbFloat1 20s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%);
          filter: blur(90px);
          bottom: -100px; right: -80px;
          animation: orbFloat2 26s ease-in-out infinite;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,160,60,0.06), transparent 70%);
          filter: blur(90px);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: orbFloat3 22s ease-in-out infinite;
        }
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(50px,-30px); }
          66%      { transform: translate(-20px,40px); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(-40px,20px); }
          66%      { transform: translate(30px,-50px); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(-50%,-50%); }
          50%      { transform: translate(-45%,-55%); }
        }
        .food-image-row {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
        }
        .food-image {
          width: 90px; height: 90px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .plus-sign {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #F97316, #E8C878);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default NodeConoceAlicia;
