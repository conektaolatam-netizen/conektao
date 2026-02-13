import React from "react";
import { MessageSquare, ShoppingCart, Truck, Star } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Atiende y recomienda",
    description:
      "Mejor que un vendedor humano. Más rápida, empática y entiende lo que el cliente realmente quiere.",
    gradient: "from-primary to-primary-hover",
  },
  {
    icon: ShoppingCart,
    number: "02",
    title: "Toma el pedido",
    description:
      "Confirma cada detalle del pedido y el método de pago. Sin errores, sin confusiones.",
    gradient: "from-secondary to-secondary-hover",
  },
  {
    icon: Truck,
    number: "03",
    title: "Coordina el domicilio",
    description:
      "Organiza la entrega con el cliente. Dirección, hora y seguimiento en tiempo real.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Star,
    number: "04",
    title: "Seguimiento post-venta",
    description:
      "Le pregunta al cliente por su experiencia. Ella mejora y tu negocio también.",
    gradient: "from-secondary to-primary",
  },
];

const AliciaSteps = () => {
  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            ¿Cómo funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-semibold">
            4 pasos. Automáticos. Sin intervención humana.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative text-center transform transition-all duration-500 hover:scale-105"
            >
              {/* Number */}
              <div className="text-7xl font-black text-muted/50 mb-4 select-none transition-colors duration-500 group-hover:text-primary/20">
                {step.number}
              </div>

              {/* Icon */}
              <div
                className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-primary/40 group-hover:scale-110`}
              >
                <step.icon className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-24 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/40 to-secondary/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AliciaSteps;
