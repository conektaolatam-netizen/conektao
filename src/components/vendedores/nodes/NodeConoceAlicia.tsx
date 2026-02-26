import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, Settings } from "lucide-react";
import MicroCheckmark from "../MicroCheckmark";

interface Props { onComplete: () => void; }

const CARDS = [
  { icon: Bot, front: "🤖 Atiende WhatsApp 24/7", back: "Alicia nunca se cansa, nunca se enferma, y atiende domingos a las 2am." },
  { icon: TrendingUp, front: "📈 Sube el ticket promedio", back: "Sugiere automáticamente complementos y aumenta un 15% el ticket." },
  { icon: Settings, front: "⚙️ Se entrena como tu mejor mesero", back: "El dueño la entrena con su menú, su tono, sus reglas. 10 minutos." },
];

const NodeConoceAlicia = ({ onComplete }: Props) => {
  const [step, setStep] = useState(1); // 1: video, 2: flip cards, 3: confirm
  const [videoComplete, setVideoComplete] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // Auto-complete video after 30s
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setVideoComplete(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const flipCard = (i: number) => {
    const next = new Set(flippedCards);
    next.add(i);
    setFlippedCards(next);
  };

  const allFlipped = flippedCards.size === CARDS.length;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-2">
        Primero, deja que Alicia se presente
      </h2>

      {step === 1 && (
        <>
          <div
            className="w-full aspect-video bg-white/5 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-orange-500/30 cursor-pointer"
            onClick={() => setVideoComplete(true)}
          >
            <span className="text-gray-500 text-sm text-center px-4">
              VIDEO DE ALICIA AQUÍ
              <br />
              <span className="text-xs text-gray-600">(Toca para marcar como visto)</span>
            </span>
          </div>
          <MicroCheckmark label="✓ Video completado" show={videoComplete} />
          {videoComplete && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                Siguiente →
              </Button>
            </motion.div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-gray-400 text-sm mb-4">Toca cada tarjeta para ver más</p>
          <div className="space-y-3 mb-4">
            {CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                onClick={() => flipCard(i)}
                className="cursor-pointer"
              >
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  flippedCards.has(i)
                    ? "bg-orange-500/10 border-orange-500/40"
                    : "bg-white/5 border-white/10 hover:border-orange-500/30"
                }`}>
                  {flippedCards.has(i) ? (
                    <motion.p
                      className="text-sm text-gray-300"
                      initial={{ rotateX: 90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {card.back}
                    </motion.p>
                  ) : (
                    <span className="text-white font-medium text-sm">{card.front}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          <MicroCheckmark label="✓ Tarjetas completadas" show={allFlipped} />
          {allFlipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={() => setStep(3)}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                Siguiente →
              </Button>
            </motion.div>
          )}
        </>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center py-8">
            <motion.div
              className="text-5xl mb-4"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">¡Nivel completado!</h3>
            <p className="text-gray-400 text-sm mb-6">Ya conoces a Alicia 🤖</p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            ¡Entendido! →
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NodeConoceAlicia;
