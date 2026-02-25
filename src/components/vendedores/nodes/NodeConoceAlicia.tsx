import React from "react";
import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, Settings } from "lucide-react";

interface Props { onComplete: () => void; }

const bullets = [
  { icon: Bot, text: "Atiende WhatsApp 24/7 sin descanso" },
  { icon: TrendingUp, text: "Sube el ticket promedio automáticamente" },
  { icon: Settings, text: "Se entrena como tu mejor mesero" },
];

const NodeConoceAlicia = ({ onComplete }: Props) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-foreground mb-2">
      Primero, deja que Alicia se presente
    </h2>

    {/* Video placeholder */}
    <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center mb-6 border-2 border-dashed border-primary/30">
      <span className="text-muted-foreground text-sm text-center px-4">
        VIDEO DE ALICIA AQUÍ
      </span>
    </div>

    <div className="space-y-4 mb-8">
      {bullets.map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground font-medium text-sm">{text}</span>
        </div>
      ))}
    </div>

    <Button
      onClick={onComplete}
      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/25"
    >
      Entendido, siguiente →
    </Button>
  </div>
);

export default NodeConoceAlicia;
