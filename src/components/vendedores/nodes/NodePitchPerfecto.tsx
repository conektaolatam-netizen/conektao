import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Props { onComplete: () => void; }

const SCRIPT = `Mire, le cuento rápido. Alicia es una asistente de inteligencia artificial que atiende el WhatsApp de su negocio las 24 horas — toma pedidos, responde preguntas, sube el ticket promedio y nunca se cansa ni se enferma.

La diferencia con un empleado es que usted la entrena exactamente como quiere — como entrenaría a su mejor mesero, solo que esta siempre le hace caso.

El valor es $450.000 pesos al mes. Pero antes de que me diga que es caro, déjeme mostrarle algo rápido.`;

const NodePitchPerfecto = ({ onComplete }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-1">
        Así se vende Alicia en 60 segundos
      </h2>
      <p className="text-muted-foreground mb-6">
        Mira cómo se hace. Después tú lo repites.
      </p>

      {/* Video placeholder */}
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center mb-6 border-2 border-dashed border-primary/30">
        <span className="text-muted-foreground text-sm text-center px-4">
          VIDEO DEL ELEVATOR PITCH AQUÍ
        </span>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-primary/5 mb-4">
          <span className="font-semibold text-foreground text-sm">
            El guión exacto (para que lo aprendas)
          </span>
          <ChevronDown className={`w-5 h-5 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-line italic">
              "{SCRIPT}"
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={onComplete}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/25"
      >
        Ya sé el pitch →
      </Button>
    </div>
  );
};

export default NodePitchPerfecto;
