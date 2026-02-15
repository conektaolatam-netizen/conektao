import React from "react";
import { Check, Zap, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AliciaPlans = () => {
  const navigate = useNavigate();

  return (
    <section id="planes" className="relative z-10 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Planes
          </h2>
          <p className="text-lg text-muted-foreground font-semibold">
            Elige el plan que mejor se adapte a tu negocio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan ALICIA */}
          <div
            className="relative rounded-2xl border-2 border-primary/40 bg-card/80 backdrop-blur-xl p-8 transition-all duration-500 hover:scale-[1.02] hover:border-primary/60"
            style={{ boxShadow: "0 0 50px hsl(25 100% 50% / 0.15)" }}
          >
            <div className="absolute -top-3 left-6">
              <span className="px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                MÁS POPULAR
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Plan ALICIA</h3>
                <p className="text-sm text-muted-foreground">1 sucursal</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                $450.000
              </span>
              <span className="text-muted-foreground ml-2">COP/mes</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "Atención ilimitada a clientes",
                "Upselling inteligente automático",
                "Toma de pedidos 24/7",
                "Coordinación de domicilios",
                "Seguimiento post-venta",
                "Dashboard de rendimiento",
                "Reportes semanales IA",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/alicia/registro?plan=alicia")}
              className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              Contratar a ALICIA
            </button>
          </div>

          {/* Plan Enterprise */}
          <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 transition-all duration-500 hover:scale-[1.02] hover:border-secondary/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center">
                <Building className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Enterprise</h3>
                <p className="text-sm text-muted-foreground">Multi-sucursal</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black text-foreground">
                Personalizado
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "Todo lo del Plan ALICIA",
                "Múltiples sucursales",
                "Dashboards gerenciales",
                "Reportes IA avanzados",
                "Soporte prioritario",
                "Integración POS personalizada",
                "Onboarding dedicado",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                const el = document.getElementById("contacto");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 rounded-xl font-semibold text-secondary border-2 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
            >
              Contactar ventas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AliciaPlans;
