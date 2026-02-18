import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import AliciaHero from "@/components/alicia-saas/AliciaHero";
import AliciaSteps from "@/components/alicia-saas/AliciaSteps";
import AliciaBenefits from "@/components/alicia-saas/AliciaBenefits";
import AliciaDemoChat from "@/components/alicia-saas/AliciaDemoChat";
import AliciaPlans from "@/components/alicia-saas/AliciaPlans";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const AliciaLanding = () => {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal({ threshold: 0.15 });
  const { ref: footerRef, isVisible: footerVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-feedback"
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
      <section
        id="contacto"
        ref={ctaRef as React.RefObject<HTMLElement>}
        className={`relative z-10 py-20 px-4 scroll-reveal ${ctaVisible ? "visible" : ""}`}
      >
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover transition-all duration-300 shadow-lg shadow-primary/25 active:scale-95 touch-feedback"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        ref={footerRef as React.RefObject<HTMLElement>}
        className={`relative z-10 py-8 px-4 border-t border-primary/20 scroll-reveal ${footerVisible ? "visible" : ""}`}
      >
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
