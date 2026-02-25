import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

interface Props { onClose: () => void; }

const WA_URL = "https://wa.me/3176436656?text=Hola%2C%20completé%20el%20Método%20Alicia%20y%20quiero%20ser%20vendedor";

const CONFETTI_COLORS = ["#f97316", "#fb923c", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

const CompletionCelebration = ({ onClose }: Props) => {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(p);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: p.color, left: `${p.x}%`, top: -10 }}
          animate={{ y: [0, window.innerHeight + 20], rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)], opacity: [1, 0.7, 0] }}
          transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: "easeIn" }}
        />
      ))}

      <motion.div
        className="text-center px-6 z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          🎉 ¡Completaste el Método Alicia!
        </h2>
        <p className="text-muted-foreground mb-8">
          Ya sabes todo lo que necesitas para empezar a vender
        </p>

        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full max-w-xs h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-primary-foreground rounded-xl shadow-lg shadow-primary/25 mb-3"
        >
          Quiero ser vendedor →
        </a>
        <br />
        <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
          Cerrar
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CompletionCelebration;
