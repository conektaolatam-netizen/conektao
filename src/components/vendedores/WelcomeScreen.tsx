import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import VendedorRegistration from "./VendedorRegistration";

interface Props {
  onRegistered: () => void;
}

const SEED = 902;

const WelcomeScreen = ({ onRegistered }: Props) => {
  const [count, setCount] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  // Fetch real count
  useEffect(() => {
    supabase
      .from("vendedores" as any)
      .select("id", { count: "exact", head: true })
      .eq("certificado", true)
      .then(({ count: c }) => setCount(SEED + (c ?? 0)));
  }, []);

  // Slow random increment for social proof
  useEffect(() => {
    if (count === null) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCount((prev) => (prev ?? SEED) + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [count]);

  // Memoize particles so they don't re-render
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${8 + Math.random() * 12}s`,
        size: Math.random() > 0.5 ? 2 : 1,
      })),
    []
  );

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 30 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.8, ease: "easeOut" as const, delay },
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
            background: "rgba(249,115,22,0.4)",
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
        <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
          {/* 1. BADGE — SVG */}
          <motion.div className="relative" {...fadeUp(0.1)}>
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="absolute rounded-full border border-[rgba(212,168,83,0.2)]"
                style={{
                  width: "190px",
                  height: "190px",
                  animation: "badgePulseRing 3s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full border border-[rgba(212,168,83,0.1)]"
                style={{
                  width: "210px",
                  height: "210px",
                  animation: "badgePulseRing 3s ease-in-out infinite 0.5s",
                }}
              />
            </div>

            <svg width="160" height="160" viewBox="0 0 160 160" className="relative z-10">
              <defs>
                <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F0C97A" />
                  <stop offset="100%" stopColor="#A0742A" />
                </linearGradient>
                <linearGradient id="innerFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1C1409" />
                  <stop offset="100%" stopColor="#0A0A0A" />
                </linearGradient>
                <clipPath id="badgeClip">
                  <circle cx="80" cy="80" r="74" />
                </clipPath>
              </defs>
              {/* Outer circle */}
              <circle cx="80" cy="80" r="78" fill="none" stroke="url(#goldStroke)" strokeWidth="2" />
              {/* Inner filled circle */}
              <circle cx="80" cy="80" r="74" fill="url(#innerFill)" />
              {/* Dashed inner ring */}
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="rgba(212,168,83,0.3)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              {/* Shine sweep — animated rect clipped to circle */}
              <g clipPath="url(#badgeClip)">
                <rect x="-160" y="0" width="80" height="160" fill="rgba(255,255,255,0.12)" transform="skewX(-20)">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="-80 0; 320 0; -80 0"
                    dur="4s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                </rect>
              </g>
              {/* Text content */}
              <text x="80" y="62" textAnchor="middle" fontSize="32">🏅</text>
              <text
                x="80"
                y="88"
                textAnchor="middle"
                fill="#F0C97A"
                fontSize="10"
                fontWeight="800"
                letterSpacing="0.18em"
                fontFamily="inherit"
              >
                VENDEDOR
              </text>
              <text
                x="80"
                y="102"
                textAnchor="middle"
                fill="#F0C97A"
                fontSize="10"
                fontWeight="800"
                letterSpacing="0.18em"
                fontFamily="inherit"
              >
                CERTIFICADO
              </text>
              <text
                x="80"
                y="124"
                textAnchor="middle"
                fill="rgba(212,168,83,0.6)"
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.25em"
                fontFamily="inherit"
              >
                Conektao
              </text>
            </svg>
          </motion.div>

          {/* 2. HEADLINE */}
          <motion.div className="text-center" {...fadeUp(0.2)}>
            <h1 className="text-2xl sm:text-[28px] font-bold text-white leading-[1.2] mb-3">
              Este certificado es tuyo — si lo completas
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              En 10 minutos aprendes todo lo que necesitas para ganar
              <br />
              <span className="font-bold" style={{ color: "#FB923C" }}>
                $350.000 COP por cada cliente que cierres
              </span>
            </p>
          </motion.div>

          {/* 3. SOCIAL COUNTER */}
          {count !== null && (
            <motion.div
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              {...fadeUp(0.3)}
            >
              {/* Green dot with blink */}
              <span
                className="inline-block w-[7px] h-[7px] rounded-full flex-shrink-0"
                style={{
                  background: "#22C55E",
                  boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                  animation: "greenBlink 2s ease-in-out infinite",
                }}
              />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="font-bold text-white">{count}</span> vendedores certificados en Colombia
              </span>
            </motion.div>
          )}

          {/* 4. CTA BUTTON or REGISTRATION */}
          {!showRegister ? (
            <motion.div className="w-full flex flex-col items-center" {...fadeUp(0.4)}>
              <button
                onClick={() => setShowRegister(true)}
                className="w-full max-w-[360px] py-4 px-8 rounded-xl text-white font-semibold text-base transition-all hover:-translate-y-0.5"
                style={{
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
              <span className="text-xs mt-3" style={{ color: "#888" }}>
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
            {...fadeUp(0.5)}
          >
            {[
              { value: "$350K", label: "por cliente\ncerrado" },
              { value: "10 min", label: "para\ncertificarte" },
              { value: "24/7", label: "Alicia trabaja\npor ti" },
            ].map((m, i) => (
              <div
                key={i}
                className="py-2"
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ color: "#FB923C" }}
                >
                  {m.value}
                </div>
                <div
                  className="text-[11px] sm:text-xs leading-tight whitespace-pre-line"
                  style={{ color: "#888" }}
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
