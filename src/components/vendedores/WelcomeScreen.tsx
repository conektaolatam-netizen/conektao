import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";


interface Props {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: Props) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("vendedores" as any)
      .select("id", { count: "exact", head: true })
      .then(({ count: c }) => setCount(902 + (c ?? 0)));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-orange-600/8 blur-[100px]" />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-orange-400/40 animate-float-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Championship Badge */}
        <motion.div
          className="relative mx-auto mb-8 w-52 h-52"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Outer decorative ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 p-[4px] shadow-[0_0_60px_rgba(245,158,11,0.4),0_0_120px_rgba(249,115,22,0.2)]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.15),transparent_70%)]" />
              
              {/* Shine sweep animation */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute -inset-full animate-[badge-shine_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" />
              </div>

              {/* Star */}
              <span className="text-3xl mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] relative z-10">⭐</span>
              
              {/* Text */}
              <span className="text-[10px] font-black tracking-[0.15em] text-amber-300 uppercase relative z-10">
                Vendedor
              </span>
              <span className="text-[11px] font-black tracking-[0.12em] text-amber-200 uppercase relative z-10">
                Certificado
              </span>
              <span className="text-sm font-black text-orange-400 mt-0.5 relative z-10">
                ALICIA
              </span>
              <span className="text-[8px] text-amber-400/50 mt-1 font-bold tracking-[0.2em] uppercase relative z-10">
                Conektao
              </span>
            </div>
          </div>

          {/* Decorative dots around perimeter */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 50 + 48 * Math.cos(angle);
            const y = 50 + 48 * Math.sin(angle);
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/60"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
              />
            );
          })}
        </motion.div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
          Este certificado es tuyo — si lo completas
        </h1>

        <p className="text-sm sm:text-base text-gray-400 mb-6 leading-relaxed">
          En 10 minutos aprendes todo lo que necesitas para ganar{" "}
          <span className="text-orange-400 font-bold">$350.000 COP</span> por cada cliente que cierres
        </p>

        {/* Social counter */}
        {count !== null && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-lg">🔥</span>
            <span className="text-sm text-gray-300">
              Únete a los <span className="text-orange-400 font-bold">{count}</span> vendedores certificados en Colombia
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          onClick={onStart}
          className="w-full max-w-xs mx-auto h-14 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-orange-500/30 transition-all"
          whileTap={{ scale: 0.97 }}
        >
          Quiero mi certificado →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
