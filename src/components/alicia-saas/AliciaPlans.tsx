import React, { useState } from "react";
import { Check, Zap, Building, Sparkles, TrendingUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import AliciaContactModal from "./AliciaContactModal";

const AliciaPlans = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"alicia" | "enterprise">("alicia");
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal({ threshold: 0.1 });

  const openModal = () => { setSelectedPlan("alicia"); setModalOpen(true); };

  return (
    <section id="planes" className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-16 scroll-reveal ${titleVisible ? "visible" : ""}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Planes
          </h2>
          <p className="text-lg text-muted-foreground font-semibold">
            Elige el plan que mejor se adapte a tu negocio
          </p>
        </div>

        <div
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* ── Plan Por Pedido ── */}
          <div
            className={`relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-7 transition-all duration-500 hover:scale-[1.02] hover:border-primary/40 scroll-reveal-left reveal-delay-0 ${cardsVisible ? "visible" : ""}`}
          >
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-muted border border-border/60 text-muted-foreground">
                Sin riesgo
              </span>
            </div>

            <div className="flex items-center gap-3 mb-5 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Por Pedido</h3>
                <p className="text-xs text-muted-foreground">Sin mensualidad</p>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-black text-foreground">$3.900</span>
              <span className="text-muted-foreground text-sm ml-1">COP</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">por pedido cerrado</p>

            <p className="text-xs text-muted-foreground mb-5 italic">
              Sin mínimo. Si ALICIA no vende, no pagas nada.
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                "Atención ilimitada a clientes",
                "Upselling inteligente",
                "Toma de pedidos 24/7",
                "Seguimiento post-venta",
                "Dashboard de rendimiento",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={openModal}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-primary border border-primary/40 hover:bg-primary/10 transition-all duration-300 active:scale-95 touch-feedback"
            >
              Empezar gratis
            </button>
          </div>

          {/* ── Plan Starter — Más Popular ── */}
          <div
            className={`relative rounded-2xl border-2 border-primary/50 bg-card/80 backdrop-blur-xl p-7 transition-all duration-500 hover:scale-[1.02] hover:border-primary/70 scroll-reveal-left reveal-delay-1 ${cardsVisible ? "visible" : ""}`}
            style={{ boxShadow: "0 0 50px hsl(25 100% 50% / 0.15)" }}
          >
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                Más Popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-5 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Starter</h3>
                <p className="text-xs text-muted-foreground">Hasta 120 pedidos</p>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                $99.000
              </span>
              <span className="text-muted-foreground text-sm ml-1">COP/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Pedidos adicionales: $3.900 c/u
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                "Todo lo del plan Por Pedido",
                "Reportes semanales IA",
                "Coordinación de domicilios",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={openModal}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 touch-feedback"
            >
              Contratar Starter
            </button>
          </div>

          {/* ── Plan Estándar ── */}
          <div
            className={`relative rounded-2xl border border-secondary/40 bg-card/60 backdrop-blur-xl p-7 transition-all duration-500 hover:scale-[1.02] hover:border-secondary/60 scroll-reveal-right reveal-delay-2 ${cardsVisible ? "visible" : ""}`}
            style={{ boxShadow: "0 0 40px hsl(174 100% 29% / 0.12)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Estándar</h3>
                <p className="text-xs text-muted-foreground">Hasta 300 pedidos</p>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-black text-foreground">$219.000</span>
              <span className="text-muted-foreground text-sm ml-1">COP/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Adicionales: $3.900 hasta 500 pedidos, luego $2.900 c/u
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                "Todo lo del plan Starter",
                "Reportes IA avanzados",
                "Soporte prioritario",
                "Onboarding dedicado",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-secondary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={openModal}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-secondary border-2 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 active:scale-95 touch-feedback"
            >
              Contratar Estándar
            </button>
          </div>

          {/* ── Enterprise ── */}
          <div
            className={`relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-7 transition-all duration-500 hover:scale-[1.02] hover:border-border/70 scroll-reveal-right reveal-delay-3 ${cardsVisible ? "visible" : ""}`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                <Building className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Enterprise</h3>
                <p className="text-xs text-muted-foreground">Multi-sucursal</p>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-black text-foreground">Personalizado</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Precio según volumen y sucursales
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                "Todo lo del plan Estándar",
                "Múltiples sucursales",
                "Dashboards gerenciales",
                "Integración POS personalizada",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => { setSelectedPlan("enterprise"); setModalOpen(true); }}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-foreground border border-border/60 hover:bg-muted transition-all duration-300 active:scale-95 touch-feedback"
            >
              Contactar ventas
            </button>
          </div>
        </div>
      </div>

      <AliciaContactModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
      />
    </section>
  );
};

export default AliciaPlans;
