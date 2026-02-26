import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import MicroCheckmark from "../MicroCheckmark";

interface Props { onComplete: () => void; }

const SCRIPT = `Mire, le cuento rápido. Alicia es una asistente de inteligencia artificial que atiende el WhatsApp de su negocio las 24 horas — toma pedidos, responde preguntas, sube el ticket promedio y nunca se cansa ni se enferma.

La diferencia con un empleado es que usted la entrena exactamente como quiere — como entrenaría a su mejor mesero, solo que esta siempre le hace caso.

El valor es $450.000 pesos al mes. Pero antes de que me diga que es caro, déjeme mostrarle algo rápido.`;

const NodePitchPerfecto = ({ onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [videoComplete, setVideoComplete] = useState(false);
  const [scriptRevealed, setScriptRevealed] = useState(false);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setVideoComplete(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-1">
        Así se vende Alicia en 60 segundos
      </h2>
      <p className="text-gray-400 mb-6">
        Mira cómo se hace. Después tú lo repites.
      </p>

      {step === 1 && (
        <>
          <div
            className="w-full aspect-video bg-white/5 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-orange-500/30 cursor-pointer"
            onClick={() => setVideoComplete(true)}
          >
            <span className="text-gray-500 text-sm text-center px-4">
              VIDEO DEL ELEVATOR PITCH AQUÍ
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
          <div
            onClick={() => setScriptRevealed(true)}
            className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer mb-4 ${
              scriptRevealed
                ? "bg-orange-500/10 border-orange-500/40"
                : "bg-white/5 border-white/10 hover:border-orange-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {scriptRevealed ? (
                <Unlock className="w-4 h-4 text-orange-400" />
              ) : (
                <Lock className="w-4 h-4 text-gray-500" />
              )}
              <span className="font-semibold text-white text-sm">
                {scriptRevealed ? "🔓 Guión secreto desbloqueado" : "🔒 Toca para desbloquear el guión secreto"}
              </span>
            </div>
            {scriptRevealed && (
              <motion.p
                className="text-gray-300 text-sm leading-relaxed whitespace-pre-line italic"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                "{SCRIPT}"
              </motion.p>
            )}
          </div>
          <MicroCheckmark label="✓ Guión desbloqueado" show={scriptRevealed} />
          {scriptRevealed && (
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
              🎤
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">¡Nivel completado!</h3>
            <p className="text-gray-400 text-sm mb-6">Dominas el pitch 🎤</p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            ¡Ya sé el pitch! →
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NodePitchPerfecto;
