import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props { onComplete: () => void; }

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-CO");

const NodeCalculadora = ({ onComplete }: Props) => {
  const [raw, setRaw] = useState("");
  const sales = Number(raw.replace(/[^0-9]/g, "")) || 0;

  const results = useMemo(() => {
    const lostConvos = Math.round(sales * 0.000167);
    const lostSales = lostConvos * 35000;
    const recovery = lostSales * 0.4;
    const profit = recovery - 450000;
    return { lostConvos, lostSales, recovery, profit };
  }, [sales]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">
        Practica antes de usarla con un cliente
      </h2>
      <p className="text-muted-foreground mb-6">
        Pon cualquier número y ve cómo funciona
      </p>

      <label className="text-sm font-medium text-foreground mb-2 block">
        ¿Cuánto vende el negocio al mes en domicilios?
      </label>
      <Input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Ej: 5000000"
        className="h-14 text-lg mb-6"
        type="text"
        inputMode="numeric"
      />

      {sales > 0 && (
        <div className="space-y-3 mb-6 animate-fade-in">
          <ResultCard label="Conversaciones perdidas al día" value={String(results.lostConvos)} />
          <ResultCard label="Ventas perdidas al mes" value={fmt(results.lostSales)} />
          <ResultCard label="Lo que Alicia recupera (40% conservador)" value={fmt(results.recovery)} />
          <div className={`p-4 rounded-xl border-2 ${results.profit >= 0 ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"}`}>
            <div className="text-xs text-muted-foreground mb-1">
              Ganancia extra vs costo de Alicia
            </div>
            <div className={`text-2xl font-bold ${results.profit >= 0 ? "text-green-500" : "text-destructive"}`}>
              {fmt(results.profit)}
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-6 text-center italic">
        "Alicia se paga sola en los primeros días. Lo que viene después es ganancia pura."
      </p>

      <Button
        onClick={onComplete}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/25"
      >
        Entendido →
      </Button>
    </div>
  );
};

const ResultCard = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-xl font-bold text-primary">{value}</div>
  </div>
);

export default NodeCalculadora;
