import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, MessageCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props { onClose: () => void; }

const CONFETTI_COLORS = ["#f97316", "#fb923c", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

const CompletionCelebration = ({ onClose }: Props) => {
  const [phase, setPhase] = useState<"confetti" | "certificate">("confetti");
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);
  const certRef = useRef<HTMLDivElement>(null);
  const vendedorName = localStorage.getItem("vendedor_name") || "Vendedor";
  const vendedorId = localStorage.getItem("vendedor_id");
  const today = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    // Generate confetti
    const p = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(p);

    // Transition to certificate after 3s
    const timer = setTimeout(() => setPhase("certificate"), 3000);

    // Update Supabase
    if (vendedorId) {
      supabase
        .from("vendedores" as any)
        .update({ certificado: true, fecha_certificacion: new Date().toISOString() } as any)
        .eq("id", vendedorId)
        .then(({ error }) => {
          if (error) console.error("Error updating certificado:", error);
        });
    }

    return () => clearTimeout(timer);
  }, [vendedorId]);

  const handleDownload = async () => {
    if (!certRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `certificado-vendedor-${vendedorName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const waShareText = encodeURIComponent(
    "¡Acabo de certificarme como Vendedor Oficial de Alicia por Conektao! 🎉⭐ Si tienes un restaurante y quieres que te cuente cómo funciona, escríbeme. conektao.com/alicia"
  );
  const waShareUrl = `https://wa.me/?text=${waShareText}`;
  const waContactUrl = "https://wa.me/3176436656?text=Hola%2C%20acabo%20de%20certificarme%20y%20quiero%20empezar%20a%20vender";

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti phase */}
      {phase === "confetti" && (
        <>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: p.color, left: `${p.x}%`, top: -10 }}
              animate={{
                y: [0, window.innerHeight + 20],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0.7, 0],
              }}
              transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: "easeIn" }}
            />
          ))}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <motion.path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </svg>
              </motion.div>
              <h2 className="text-3xl font-bold text-white">¡Lo lograste! 🎉</h2>
            </motion.div>
          </div>
        </>
      )}

      {/* Certificate phase */}
      {phase === "certificate" && (
        <motion.div
          className="flex-1 flex flex-col items-center justify-start py-8 px-4 w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Certificate Card */}
          <div
            ref={certRef}
            className="w-full bg-white rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl shadow-orange-500/10"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {/* Decorative border */}
            <div className="border-4 border-orange-400/50 rounded-xl p-5 sm:p-6 relative">
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-orange-500" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-orange-500" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-orange-500" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-orange-500" />

              {/* Logo */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold text-orange-500 tracking-wider" style={{ fontFamily: "sans-serif" }}>
                    CONEKTAO
                  </span>
                </div>
              </div>

              <h3 className="text-center text-lg sm:text-xl font-bold text-gray-800 tracking-widest mb-1">
                CERTIFICADO DE
              </h3>
              <h3 className="text-center text-lg sm:text-xl font-bold text-gray-800 tracking-widest mb-4">
                VENDEDOR OFICIAL
              </h3>

              <p className="text-center text-sm text-gray-500 mb-3">
                Este certificado acredita que
              </p>

              <p className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {vendedorName}
              </p>

              <p className="text-center text-sm text-gray-600 leading-relaxed mb-4 max-w-sm mx-auto" style={{ fontFamily: "sans-serif" }}>
                ha completado exitosamente el Método Alicia y está certificado para representar y vender los productos de Conektao en Colombia
              </p>

              <p className="text-center text-xs text-gray-400 mb-4">{today}</p>

              {/* Badge */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full border-3 border-orange-400 bg-gradient-to-br from-orange-100 to-yellow-50 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-[8px] font-bold text-orange-600 leading-tight text-center px-1">
                    Vendedor Certificado ⭐
                  </span>
                </div>
              </div>

              {/* Signature line */}
              <div className="text-center">
                <div className="w-32 h-px bg-gray-300 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400" style={{ fontFamily: "sans-serif" }}>
                  Conektao — Transformación Digital para Restaurantes
                </p>
              </div>

              <p className="text-center text-[9px] text-gray-300 mt-3" style={{ fontFamily: "sans-serif" }}>
                conektao.com
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-orange-500/30 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Compartir en WhatsApp 📲
            </a>

            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full h-12 border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar certificado 📄
            </Button>

            <a
              href={waContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-400 hover:text-orange-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Contactar a Conektao para empezar →
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CompletionCelebration;
