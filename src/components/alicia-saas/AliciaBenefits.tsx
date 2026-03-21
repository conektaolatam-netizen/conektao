import React from "react";
import { TrendingUp, MessageSquare, Clock, HeartHandshake } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const benefits = [
  {
    icon: TrendingUp,
    metric: "+20%",
    title: "Ticket promedio",
    description: "Upselling inteligente en cada conversación",
    glow: "hsl(25 100% 50% / 0.28)",
  },
  {
    icon: MessageSquare,
    metric: "100%",
    title: "Clientes con respuesta",
    description: "Cada cliente es atendido al instante en WhatsApp",
    glow: "hsl(174 100% 29% / 0.28)",
  },
  {
    icon: Clock,
    metric: "24/7",
    title: "Atención continua",
    description: "Sin costos de personal adicional. Siempre disponible.",
    glow: "hsl(25 100% 50% / 0.28)",
  },
  {
    icon: HeartHandshake,
    metric: "Auto",
    title: "Seguimiento post-venta",
    description: "Retroalimentación automática que mejora tu operación",
    glow: "hsl(174 100% 29% / 0.28)",
  },
];

const delayClasses = ["reveal-delay-0", "reveal-delay-1", "reveal-delay-2", "reveal-delay-3"];

const AliciaBenefits = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.08 });

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 scroll-reveal ${titleVisible ? "visible" : ""}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Resultados reales
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-semibold">
            Métricas comprobadas con restaurantes reales en Colombia
          </p>
        </div>

        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-primary/30 scroll-reveal-scale ${delayClasses[index]} ${gridVisible ? "visible" : ""}`}
              style={{
                boxShadow: gridVisible ? `0 0 30px ${benefit.glow}` : "0 0 0px transparent",
                transition: "box-shadow 0.8s ease-out, transform 0.5s ease-out, border-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 50px ${benefit.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${benefit.glow}`;
              }}
            >
              <benefit.icon className="w-8 h-8 text-primary mb-4" />
              <div className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent metric-pop">
                {benefit.metric}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AliciaBenefits;
