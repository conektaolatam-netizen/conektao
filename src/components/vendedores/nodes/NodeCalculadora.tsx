import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MicroCheckmark from "../MicroCheckmark";

interface Props { onComplete: () => void; }

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-CO");

const NodeCalculadora = ({ onComplete }: Props) => {
  const [raw, setRaw] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const sales = Number(raw.replace(/[^0-9]/g, "")) || 0;

  const results = useMemo(() => {
    const lostConvos = Math.round(sales * 0.000167);
    const lostSales = lostConvos * 35000;
    const recovery = lostSales * 0.4;
    const profit = recovery - 450000;
    return { lostConvos, lostSales, recovery, profit };
  }, [sales]);

  const handleCalculate = () => {
    if (results.profit >= 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setConfirmed(true);
  };

  return (
    <div className="animate-fade-in relative">
      {/* Confetti burst */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ["#f97316", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"][i % 5],
                left: `${40 + Math.random() * 20}%`,
                top: "40%",
              }}
              initial={{ opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                opacity: 0,
                scale: [1, 1.5, 0],
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <h2 className="text-2xl font-bold text-white mb-1">
        Practica antes de usarla con un cliente
      </h2>
      <p className="text-gray-400 mb-6">
        Pon cualquier número y ve cómo funciona
      </p>

      <label className="text-sm font-medium text-gray-300 mb-2 block">
        ¿Cuánto vende el negocio al mes en domicilios?
      </label>
      <Input
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setConfirmed(false); }}
        placeholder="Ej: 5000000"
        className="h-14 text-lg mb-4 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        type="text"
        inputMode="numeric"
      />

      {sales > 0 && (
        <div className="space-y-3 mb-4 animate-fade-in">
          <ResultCard label="Conversaciones perdidas al día" value={String(results.lostConvos)} />
          <ResultCard label="Ventas perdidas al mes" value={fmt(results.lostSales)} />
          <ResultCard label="Lo que Alicia recupera (40% conservador)" value={fmt(results.recovery)} />
          <div className={`p-4 rounded-xl border-2 ${results.profit >= 0 ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
            <div className="text-xs text-gray-400 mb-1">
              Ganancia extra vs costo de Alicia
            </div>
            <div className={`text-2xl font-bold ${results.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {fmt(results.profit)}
            </div>
            {results.profit >= 0 && !confirmed && (
              <motion.p
                className="text-xs text-green-400 mt-2 font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ¡Así es como se cierra una venta! 💥
              </motion.p>
            )}
          </div>
        </div>
      )}

      {sales > 0 && !confirmed && (
        <Button
          onClick={handleCalculate}
          className="w-full h-12 mb-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
        >
          Ver resultado final
        </Button>
      )}

      <MicroCheckmark label="✓ Calculadora dominada" show={confirmed} />

      {confirmed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={onComplete}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            ¡A vender! →
          </Button>
        </motion.div>
      )}
    </div>
  );
};

const ResultCard = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 rounded-xl border border-orange-500/20 bg-white/5">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className="text-xl font-bold text-orange-400">{value}</div>
  </div>
);

export default NodeCalculadora;
