import React from "react";
import { Button } from "@/components/ui/button";

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

const NodeVendeConData = ({ onComplete }: Props) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-foreground mb-1">
      Estos números cierran ventas
    </h2>
    <p className="text-muted-foreground mb-6">Apréndelos. Son tu munición.</p>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-3 mb-8">
      {STATS.map((s, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border border-primary/20 bg-primary/5 ${i === 4 ? "col-span-2" : ""}`}
        >
          <div className="text-2xl font-bold text-primary mb-1">{s.value}</div>
          <div className="text-xs text-muted-foreground">{s.desc}</div>
        </div>
      ))}
    </div>

    {/* Hooks */}
    <h3 className="font-bold text-foreground mb-3">¿Cómo abrir la conversación?</h3>
    <div className="space-y-3 mb-8">
      {HOOKS.map((h, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground"
        >
          <div className="text-xs font-bold opacity-80 mb-1">{h.label}</div>
          <div className="text-sm font-medium leading-snug">"{h.text}"</div>
        </div>
      ))}
    </div>

    {/* Objection handler */}
    <h3 className="font-bold text-foreground mb-3">Si te dicen que es muy caro:</h3>
    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-8">
      <p className="text-sm text-foreground italic">
        "¿Me permite mostrarle algo que tarda 30 segundos? Solo necesito saber cuánto vende al mes en domicilios."
      </p>
    </div>

    <Button
      onClick={onComplete}
      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/25"
    >
      Ya tengo la data →
    </Button>
  </div>
);

export default NodeVendeConData;
