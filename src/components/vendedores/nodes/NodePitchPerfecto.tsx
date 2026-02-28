import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const NodePitchPerfecto = ({ onComplete }: Props) => {
  const [video1Ended, setVideo1Ended] = useState(false);
  const [video2Ended, setVideo2Ended] = useState(false);
  const [phase, setPhase] = useState<"watching" | "complete">("watching");
  const [xpWidth, setXpWidth] = useState(0);
  const video2Ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to video 2 when video 1 ends
  useEffect(() => {
    if (video1Ended && video2Ref.current) {
      setTimeout(() => {
        video2Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [video1Ended]);

  // Transition to completion when both videos end
  useEffect(() => {
    if (video1Ended && video2Ended) {
      setTimeout(() => {
        setPhase("complete");
        setTimeout(() => setXpWidth(100), 300);
      }, 600);
    }
  }, [video1Ended, video2Ended]);

  if (phase === "complete") {
    return (
      <div className="animate-fade-in">
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Green checkmark */}
          <motion.div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 40% 35%, #22C55E, #15803D)",
              boxShadow: "0 0 0 4px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.4)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </motion.div>

          <h3 className="text-xl font-bold text-white mb-2">¡Nivel completado!</h3>
          <p className="text-gray-400 text-sm mb-6">
            Ya dominas las dos técnicas de venta 🎯
          </p>

          {/* XP bar */}
          <div className="max-w-xs mx-auto mb-8">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">XP ganado</span>
              <span style={{ color: "#22C55E" }} className="font-bold">+200 XP</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(to right, #22C55E, #15803D)",
                  boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${xpWidth}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={onComplete}
            className="w-full h-14 rounded-xl text-base font-semibold text-white px-6"
            style={{
              background: "linear-gradient(to right, #F59E0B, #F97316)",
              boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
            }}
          >
            ¡Listo! Continuar <span style={{ marginLeft: 8 }}>→</span>
          </button>

          <p className="mt-4" style={{ fontSize: 13, color: "#888888" }}>
            ¿Tienes alguna duda? Escríbele a Alicia por WhatsApp 💬
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-1">Convence en Poco Tiempo</h2>
      <p className="text-gray-400 mb-8 text-sm">
        Dos técnicas para que el dueño te dé su atención — y su sí.
      </p>

      {/* Video 1 */}
      <div className="mb-2">
        <p
          className="text-xs font-bold tracking-widest mb-1"
          style={{ color: "#F97316", textTransform: "uppercase" as const }}
        >
          Paso 1 — Despierta su interés
        </p>
        <p className="text-xs text-gray-500 mb-3">
          60 segundos. Úsalo en la puerta, en el pasillo, en cualquier momento.
        </p>
        <div
          className="w-full aspect-video rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: video1Ended
              ? "1px solid rgba(34,197,94,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={() => !video1Ended && setVideo1Ended(true)}
        >
          {video1Ended ? (
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" style={{ color: "#22C55E" }} />
              <span className="text-sm" style={{ color: "#22C55E" }}>Video completado</span>
            </div>
          ) : (
            <span className="text-gray-600 text-sm text-center px-4">
              Video próximamente
              <br />
              <span className="text-xs text-gray-700">(Toca para simular)</span>
            </span>
          )}
        </div>
      </div>

      {/* Divider between videos */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: "rgba(249,115,22,0.3)" }} />
        <span className="text-xs" style={{ color: "#F97316" }}>
          Ahora el paso 2 👇
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(249,115,22,0.3)" }} />
      </div>

      {/* Video 2 */}
      <div ref={video2Ref} className="mb-2">
        <p
          className="text-xs font-bold tracking-widest mb-1"
          style={{ color: "#F97316", textTransform: "uppercase" as const }}
        >
          Paso 2 — Ciérralo con el computador
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Siéntate con él, abre Conektao.com, y muéstrale esto.
        </p>
        <div
          className={`w-full aspect-video rounded-xl flex items-center justify-center transition-all duration-200 ${
            video1Ended ? "cursor-pointer" : "opacity-50"
          }`}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: video2Ended
              ? "1px solid rgba(34,197,94,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={() => video1Ended && !video2Ended && setVideo2Ended(true)}
        >
          {video2Ended ? (
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" style={{ color: "#22C55E" }} />
              <span className="text-sm" style={{ color: "#22C55E" }}>Video completado</span>
            </div>
          ) : (
            <span className="text-gray-600 text-sm text-center px-4">
              Video próximamente
              <br />
              <span className="text-xs text-gray-700">
                {video1Ended ? "(Toca para simular)" : "(Completa el paso 1 primero)"}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePitchPerfecto;
