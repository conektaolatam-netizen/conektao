import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MicroCheckmark from "../MicroCheckmark";

interface Props { onComplete: () => void; }

const STATS = [
  { value: "$450.000", desc: "Precio mensual. Menos que un empleado medio tiempo." },
  { value: "24/7", desc: "Alicia trabaja domingos, festivos y a las 2am." },
  { value: "3 a 5", desc: "Conversaciones que pierde un restaurante por día sin respuesta." },
  { value: "+15%", desc: "Aumento promedio en ticket con sugerencias automáticas." },
  { value: "10 min", desc: "Tiempo para configurar Alicia y dejarla funcionando." },
];

const HOOKS = [
  { label: "Para el dueño:", text: "¿Cuántas conversaciones de WhatsApp pierde su negocio al día sin responder?" },
  { label: "Para el administrador:", text: "¿El negocio tiene alguien respondiendo WhatsApp los domingos a las 11 de la noche?" },
  { label: "Universal:", text: "Hola, ¿me regala un minuto? Trabajo con restaurantes ayudándoles a no perder ventas por WhatsApp." },
];

const NodeVendeConData = ({ onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [revealedStats, setRevealedStats] = useState<Set<number>>(new Set());
  const [revealedHooks, setRevealedHooks] = useState(false);

  const revealStat = (i: number) => {
    const next = new Set(revealedStats);
    next.add(i);
    setRevealedStats(next);
  };

  const allStatsRevealed = revealedStats.size === STATS.length;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-1">
        Estos números cierran ventas
      </h2>
      <p className="text-gray-400 mb-6">Apréndelos. Son tu munición.</p>

      {step === 1 && (
        <>
          <p className="text-gray-500 text-xs mb-3">Toca cada tarjeta para revelar</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.15 }}
                onClick={() => revealStat(i)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${i === 4 ? "col-span-2" : ""} ${
                  revealedStats.has(i)
                    ? "bg-orange-500/10 border-orange-500/40"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="text-2xl font-bold text-orange-400 mb-1">{s.value}</div>
                {revealedStats.has(i) ? (
                  <motion.div
                    className="text-xs text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {s.desc}
                  </motion.div>
                ) : (
                  <div className="text-xs text-gray-600">Toca para ver</div>
                )}
              </motion.div>
            ))}
          </div>
          <MicroCheckmark label="✓ Data memorizada" show={allStatsRevealed} />
          {allStatsRevealed && (
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
          <h3 className="font-bold text-white mb-3">¿Cómo abrir la conversación?</h3>
          <div className="space-y-3 mb-4">
            {HOOKS.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              >
                <div className="text-xs font-bold opacity-80 mb-1">{h.label}</div>
                <div className="text-sm font-medium leading-snug">"{h.text}"</div>
              </motion.div>
            ))}
          </div>

          <h3 className="font-bold text-white mb-3 mt-6">Si te dicen que es muy caro:</h3>
          <div
            className="p-4 rounded-xl border border-orange-500/20 bg-white/5 mb-4 cursor-pointer"
            onClick={() => setRevealedHooks(true)}
          >
            {revealedHooks ? (
              <motion.p className="text-sm text-gray-300 italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                "¿Me permite mostrarle algo que tarda 30 segundos? Solo necesito saber cuánto vende al mes en domicilios."
              </motion.p>
            ) : (
              <p className="text-sm text-gray-500">Toca para ver la respuesta</p>
            )}
          </div>
          <MicroCheckmark label="✓ Hooks y objeciones dominados" show={revealedHooks} />
          {revealedHooks && (
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
            <motion.div className="text-5xl mb-4" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
              📊
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">¡Nivel completado!</h3>
            <p className="text-gray-400 text-sm mb-6">Vendes con data 📊</p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            ¡Tengo la data! →
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NodeVendeConData;
