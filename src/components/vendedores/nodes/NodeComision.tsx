import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props { onComplete: () => void; }

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

const TIMELINE = [
  { month: "Mes 1", amount: 150000, desc: "Cuando el cliente paga su primer mes" },
  { month: "Mes 2", amount: 100000, desc: "Cuando renueva el segundo mes" },
  { month: "Mes 3", amount: 100000, desc: "Cuando renueva el tercer mes" },
];

const WA_URL = "https://wa.me/3176436656?text=Hola%2C%20quiero%20ser%20vendedor%20de%20Alicia";

const NodeComision = ({ onComplete }: Props) => {
  const [clientsPerWeek, setClientsPerWeek] = useState([2]);
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
      <h2 className="text-2xl font-bold text-foreground mb-1">
        Así ganas dinero
      </h2>
      <p className="text-muted-foreground mb-6">Por cada cliente que traes:</p>

      {/* Commission Timeline */}
      <div className="flex items-start gap-3 mb-2">
        {TIMELINE.map((t, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">
              {i + 1}
            </div>
            <div className="text-lg font-bold text-primary">{fmt(t.amount)}</div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-1">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="text-center py-4 mb-6">
        <span className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
          Total: {fmt(350000)} por cliente
        </span>
      </div>

      {/* Projection calculator */}
      <h3 className="font-bold text-foreground mb-3">
        ¿Cuántos clientes puedes cerrar por semana?
      </h3>
      <div className="mb-2">
        <Slider
          value={clientsPerWeek}
          onValueChange={setClientsPerWeek}
          min={1}
          max={10}
          step={1}
          className="mb-2"
        />
        <div className="text-center text-2xl font-bold text-primary">{cpw}</div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-xs text-muted-foreground">En 1 mes</div>
          <div className="text-foreground font-semibold">
            {projections.m1Clients} clientes → <span className="text-primary">{fmt(projections.m1Revenue)}</span> en comisiones
          </div>
        </div>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-xs text-muted-foreground">En 3 meses</div>
          <div className="text-foreground font-semibold">
            {projections.m3Clients} clientes → <span className="text-primary">{fmt(projections.m3Revenue)}</span> en comisiones
          </div>
        </div>
      </div>

      {/* CTAs */}
      <h3 className="text-xl font-bold text-foreground text-center mb-4">
        ¿Listo para empezar?
      </h3>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 mb-3"
      >
        Registrarme como vendedor →
      </a>
      <Button
        variant="outline"
        onClick={onComplete}
        className="w-full h-12"
      >
        Volver al mapa
      </Button>
    </div>
  );
};

export default NodeComision;
