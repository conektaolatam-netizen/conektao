import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VendedorRegistration from "./VendedorRegistration";

interface Props {
  onRegistered: () => void;
}

const SEED = 902;

const WelcomeScreen = ({ onRegistered }: Props) => {
  const [count, setCount] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    supabase
      .from("vendedores" as any)
      .select("id", { count: "exact", head: true })
      .eq("certificado", true)
      .then(({ count: c }) => setCount(SEED + (c ?? 0)));
  }, []);

  useEffect(() => {
    if (count === null) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.72) {
        setCount((prev) => (prev ?? SEED) + 1);
      }
    }, 9000);
    return () => clearInterval(interval);
  }, [count]);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 14}s`,
        duration: `${10 + Math.random() * 14}s`,
        size: 1 + Math.random() * 1.5,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    []
  );

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 24 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.7, ease: "easeOut" as const, delay },
  });

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* Background gradients */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(249,115,22,0.12), transparent 70%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "0",
          right: "10%",
          width: "500px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(212,168,83,0.06), transparent 70%)",
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(249,115,22,${p.opacity})`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/alicia"
          className="inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a Alicia
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/40">
          <span className="text-[10px] font-bold tracking-[0.1em] text-orange-400 uppercase">
            CONEKTAO
          </span>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-14 pb-8">
        <div className="w-full max-w-[480px] flex flex-col items-center" style={{ gap: "24px" }}>
          {/* 1. BADGE */}
          <motion.div className="relative" {...fadeUp(0.08)}>
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="absolute rounded-full"
                style={{
                  width: "170px",
                  height: "170px",
                  border: "1px solid rgba(201,168,76,0.18)",
                  animation: "badgePulseRing 3s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: "190px",
                  height: "190px",
                  border: "1px solid rgba(201,168,76,0.18)",
                  animation: "badgePulseRing 3s ease-in-out infinite 0.5s",
                }}
              />
            </div>

            <svg width="136" height="136" viewBox="0 0 136 136" fill="none" className="relative z-10">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="136" y2="136" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8C878" />
                  <stop offset="35%" stopColor="#C9A84C" />
                  <stop offset="65%" stopColor="#F0D080" />
                  <stop offset="100%" stopColor="#8A6020" />
                </linearGradient>
                <linearGradient id="g2" x1="136" y1="0" x2="0" y2="136" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8C878" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.1" />
                </linearGradient>
                <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#221A0A" />
                  <stop offset="100%" stopColor="#0C0C0C" />
                </radialGradient>
                <clipPath id="badgeClip">
                  <circle cx="68" cy="68" r="60" />
                </clipPath>
              </defs>
              {/* Outer circle */}
              <circle cx="68" cy="68" r="66" stroke="url(#g1)" strokeWidth="1.8" fill="none" />
              {/* Inner filled circle */}
              <circle cx="68" cy="68" r="60" fill="url(#innerBg)" />
              {/* Inner subtle ring */}
              <circle cx="68" cy="68" r="60" stroke="url(#g2)" strokeWidth="0.6" fill="none" opacity="0.4" />
              {/* Shine sweep */}
              <g clipPath="url(#badgeClip)">
                <rect x="-136" y="0" width="60" height="136" fill="rgba(255,255,255,0.09)" transform="skewX(-20)">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="-60 0; 280 0; -60 0"
                    dur="5s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                </rect>
              </g>
              {/* Text content */}
              <text
                x="68"
                y="62"
                textAnchor="middle"
                fill="#F0C97A"
                fontSize="9"
                fontWeight="800"
                letterSpacing="0.18em"
                fontFamily="inherit"
              >
                VENDEDOR
              </text>
              <text
                x="68"
                y="75"
                textAnchor="middle"
                fill="#F0C97A"
                fontSize="9"
                fontWeight="800"
                letterSpacing="0.18em"
                fontFamily="inherit"
              >
                CERTIFICADO
              </text>
              <text
                x="68"
                y="108"
                textAnchor="middle"
                fill="rgba(212,168,83,0.6)"
                fontSize="7"
                fontWeight="700"
                letterSpacing="0.25em"
                fontFamily="inherit"
              >
                Conektao
              </text>
            </svg>
          </motion.div>

          {/* 2. HEADLINE */}
          <motion.div className="text-center" {...fadeUp(0.15)}>
            <h1
              className="font-bold text-white leading-[1.2] mb-2"
              style={{ fontSize: "clamp(20px, 5.5vw, 26px)" }}
            >
              Este certificado es tuyo —{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #FFFFFF 0%, #E8C878 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                si lo completas
              </span>
            </h1>
            <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              En 10 minutos aprendes todo lo que necesitas para ganar
              <br />
              <span className="font-semibold" style={{ color: "#E8C878" }}>
                $350.000 COP por cada cliente que cierres
              </span>
            </p>
          </motion.div>

          {/* GLOW LINE */}
          <motion.div className="w-full flex justify-center" {...fadeUp(0.22)}>
            <div
              className="relative"
              style={{
                width: "100%",
                maxWidth: "260px",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(249,115,22,0.7), transparent)",
              }}
            >
              <div
                className="absolute"
                style={{
                  top: "-1px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40%",
                  height: "3px",
                  background: "radial-gradient(ellipse, rgba(249,115,22,0.5), transparent 70%)",
                  filter: "blur(2px)",
                }}
              />
            </div>
          </motion.div>

          {/* 3. SOCIAL COUNTER */}
          {count !== null && (
            <motion.div
              className="flex items-center gap-2.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "8px 18px",
              }}
              {...fadeUp(0.28)}
            >
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{
                  width: "7px",
                  height: "7px",
                  background: "#22C55E",
                  boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                  animation: "greenBlink 2s ease-in-out infinite",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12.5px" }}>
                <span className="font-bold text-white">{count?.toLocaleString("es-CO")}</span> vendedores certificados en Colombia
              </span>
            </motion.div>
          )}

          {/* 4. CTA BUTTON or REGISTRATION */}
          {!showRegister ? (
            <motion.div className="w-full flex flex-col items-center" {...fadeUp(0.35)}>
              <button
                onClick={() => setShowRegister(true)}
                className="w-full max-w-[360px] rounded-xl text-white transition-all hover:-translate-y-0.5"
                style={{
                  padding: "15px 28px",
                  fontSize: "14.5px",
                  fontWeight: 600,
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent), #F97316",
                  boxShadow: "0 8px 32px rgba(249,115,22,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(249,115,22,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(249,115,22,0.3)";
                }}
              >
                Quiero mi certificado →
              </button>
              <span className="mt-2.5" style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
                Gratis · 10 minutos · Sin tarjeta de crédito
              </span>
            </motion.div>
          ) : (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <VendedorRegistration onComplete={onRegistered} />
            </motion.div>
          )}

          {/* 5. THREE METRICS */}
          <motion.div
            className="w-full grid grid-cols-3 text-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}
            {...fadeUp(0.42)}
          >
            {[
              { value: "$350K", label: "por cliente\ncerrado" },
              { value: "10 min", label: "para\ncertificarte" },
              { value: "24/7", label: "Alicia trabaja\npor ti" },
            ].map((m, i) => (
              <div
                key={i}
                className="py-1"
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}
              >
                <div
                  className="font-bold mb-1"
                  style={{ color: "#FB923C", fontSize: "19px" }}
                >
                  {m.value}
                </div>
                <div
                  className="leading-tight whitespace-pre-line"
                  style={{ color: "rgba(255,255,255,0.42)", fontSize: "10.5px" }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
