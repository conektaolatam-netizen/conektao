import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface Props {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: Props) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("vendedores" as any)
      .select("id", { count: "exact", head: true })
      .then(({ count: c }) => setCount(c ?? 0));
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
        {/* Badge */}
        <motion.div
          className="mx-auto mb-8 w-40 h-40 rounded-full border-4 border-orange-400/60 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.3)]"
          animate={{ scale: [1, 1.04, 1], boxShadow: ["0 0 40px rgba(249,115,22,0.2)", "0 0 80px rgba(249,115,22,0.4)", "0 0 40px rgba(249,115,22,0.2)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-6 h-6 text-orange-300 mb-1" />
          <span className="text-xs font-bold text-orange-200 leading-tight text-center px-4">
            Vendedor Certificado Alicia ⭐
          </span>
          <span className="text-[9px] text-orange-300/60 mt-1 font-semibold">CONEKTAO</span>
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
