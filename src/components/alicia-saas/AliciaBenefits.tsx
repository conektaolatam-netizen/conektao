import React from "react";
import { TrendingUp, MessageSquare, Clock, HeartHandshake } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    metric: "+15%",
    title: "Ticket promedio",
    description: "Upselling inteligente en cada conversación",
    glow: "hsl(25 100% 50% / 0.3)",
  },
  {
    icon: MessageSquare,
    metric: "0",
    title: "Mensajes perdidos",
    description: "Cada cliente es atendido al instante en WhatsApp",
    glow: "hsl(174 100% 29% / 0.3)",
  },
  {
    icon: Clock,
    metric: "24/7",
    title: "Atención continua",
    description: "Sin costos de personal adicional. Siempre disponible.",
    glow: "hsl(25 100% 50% / 0.3)",
  },
  {
    icon: HeartHandshake,
    metric: "Auto",
    title: "Seguimiento post-venta",
    description: "Retroalimentación automática que mejora tu operación",
    glow: "hsl(174 100% 29% / 0.3)",
  },
];

const AliciaBenefits = () => {
  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Resultados reales
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-semibold">
            Métricas comprobadas con restaurantes reales en Colombia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-primary/30"
              style={{
                boxShadow: `0 0 0px transparent`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${benefit.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px transparent`;
              }}
            >
              <benefit.icon className="w-8 h-8 text-primary mb-4" />
              <div
                className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              >
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
