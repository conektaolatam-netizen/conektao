import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import AliciaHero from "@/components/alicia-saas/AliciaHero";
import AliciaSteps from "@/components/alicia-saas/AliciaSteps";
import AliciaBenefits from "@/components/alicia-saas/AliciaBenefits";
import AliciaDemoChat from "@/components/alicia-saas/AliciaDemoChat";
import AliciaPlans from "@/components/alicia-saas/AliciaPlans";

const AliciaLanding = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background waves - same style as Welcome */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `
              radial-gradient(ellipse 1200px 800px at 20% 80%, hsl(25 100% 50% / 0.3) 0%, hsl(25 100% 50% / 0.15) 40%, transparent 80%),
              radial-gradient(ellipse 800px 1000px at 80% 20%, hsl(25 100% 40% / 0.25) 0%, hsl(25 100% 40% / 0.1) 50%, transparent 85%)
            `,
            animation: "wave1 3s ease-in-out infinite",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `
              radial-gradient(ellipse 1400px 600px at 60% 70%, hsl(174 100% 40% / 0.3) 0%, hsl(174 100% 40% / 0.15) 45%, transparent 85%),
              radial-gradient(ellipse 700px 1200px at 30% 30%, hsl(190 100% 42% / 0.25) 0%, hsl(190 100% 42% / 0.1) 50%, transparent 90%)
            `,
            animation: "wave2 4s ease-in-out infinite reverse",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(ellipse 1600px 400px at 70% 50%, hsl(25 100% 50% / 0.3) 0%, hsl(25 100% 50% / 0.12) 55%, transparent 90%)
            `,
            animation: "wave3 5s ease-in-out infinite",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Conektao
        </Link>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-xl rounded-full border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CONEKTAO
          </span>
        </div>
      </nav>

      {/* Sections */}
      <AliciaHero />
      <AliciaSteps />
      <AliciaBenefits />
      <AliciaDemoChat />
      <AliciaPlans />

      {/* Contact CTA */}
      <section id="contacto" className="relative z-10 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¿Tienes preguntas?
          </h2>
          <p className="text-muted-foreground mb-6">
            Escríbenos y te asesoramos sobre el plan ideal para tu negocio
          </p>
          <a
            href="https://wa.me/573001234567?text=Hola%2C%20quiero%20saber%20más%20sobre%20ALICIA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover transition-all duration-300 shadow-lg shadow-primary/25"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-primary/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CONEKTAO
            </span>
            <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Conektao. ALICIA — Tu vendedora IA por WhatsApp.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AliciaLanding;
