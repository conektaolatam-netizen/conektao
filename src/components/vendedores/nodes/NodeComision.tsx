import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import MicroCheckmark from "../MicroCheckmark";

interface Props { onComplete: () => void; }

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

const TIMELINE = [
  { month: "Mes 1", amount: 150000, desc: "Cuando el cliente paga su primer mes" },
  { month: "Mes 2", amount: 100000, desc: "Cuando renueva el segundo mes" },
  { month: "Mes 3", amount: 100000, desc: "Cuando renueva el tercer mes" },
];

const NodeComision = ({ onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [clientsPerWeek, setClientsPerWeek] = useState([2]);
  const [sliderUsed, setSliderUsed] = useState(false);
  const cpw = clientsPerWeek[0];

  const projections = useMemo(() => {
    const m1Clients = cpw * 4;
    const m1Revenue = m1Clients * 150000;
    const m3Clients = cpw * 4 * 3;
    const m3Revenue = m3Clients * 350000;
    return { m1Clients, m1Revenue, m3Clients, m3Revenue };
  }, [cpw]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-1">
        Así ganas dinero
      </h2>
      <p className="text-gray-400 mb-6">Por cada cliente que traes:</p>

      {step === 1 && (
        <>
          <div className="flex items-start gap-3 mb-2">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={i}
                className="flex-1 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm mb-2">
                  {i + 1}
                </div>
                <div className="text-lg font-bold text-orange-400">{fmt(t.amount)}</div>
                <div className="text-[11px] text-gray-400 leading-tight mt-1">{t.desc}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center py-4 mb-4">
            <span className="inline-block px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-lg">
              Total: {fmt(350000)} por cliente
            </span>
          </div>

          <h3 className="font-bold text-white mb-3">
            ¿Cuántos clientes puedes cerrar por semana?
          </h3>
          <div className="mb-2">
            <Slider
              value={clientsPerWeek}
              onValueChange={(v) => { setClientsPerWeek(v); setSliderUsed(true); }}
              min={1}
              max={10}
              step={1}
              className="mb-2"
            />
            <div className="text-center text-2xl font-bold text-orange-400">{cpw}</div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="p-4 rounded-xl bg-white/5 border border-orange-500/20">
              <div className="text-xs text-gray-400">En 1 mes</div>
              <div className="text-white font-semibold">
                {projections.m1Clients} clientes → <span className="text-orange-400">{fmt(projections.m1Revenue)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-orange-500/20">
              <div className="text-xs text-gray-400">En 3 meses</div>
              <div className="text-white font-semibold">
                {projections.m3Clients} clientes → <span className="text-orange-400">{fmt(projections.m3Revenue)}</span>
              </div>
            </div>
          </div>

          <MicroCheckmark label="✓ Proyección calculada" show={sliderUsed} />

          {sliderUsed && (
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Urgency */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-6">
            <p className="text-sm text-orange-300 font-semibold text-center">
              ⏰ Los vendedores que se certifican esta semana acceden al grupo VIP de Conektao
            </p>
          </div>

          <div className="text-center py-6">
            <motion.div className="text-5xl mb-4" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
              💰
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">¡Nivel completado!</h3>
            <p className="text-gray-400 text-sm mb-6">Listo para ganar 💰</p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            ¡Estoy listo! →
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NodeComision;
