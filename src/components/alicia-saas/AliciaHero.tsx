import React from "react";
import { Bot, Sparkles } from "lucide-react";
import aliciaAvatar from "@/assets/alicia-avatar.png";

const AliciaHero = () => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* ALICIA Avatar */}
        <div className="relative mb-10">
          <div
            className="w-48 h-48 sm:w-60 sm:h-60 mx-auto relative alicia-breathing"
            style={{
              filter: "drop-shadow(0 0 60px hsl(174 100% 29% / 0.6)) drop-shadow(0 0 120px hsl(25 100% 50% / 0.4))",
            }}
          >
            <img src={aliciaAvatar} alt="ALICIA - Vendedora IA" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 rounded-full border border-primary/30 bg-black/60 backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vendedora IA por WhatsApp
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
            Conoce a{" "}
          </span>
          <span
            className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent"
            style={{
              filter:
                "brightness(1.4) saturate(1.8) drop-shadow(0 0 20px hsl(25 100% 50% / 0.6)) drop-shadow(0 0 40px hsl(174 100% 29% / 0.4))",
            }}
          >
            ALICIA
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-semibold mb-8 px-4">
          Tu mejor vendedora.{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
            24/7. Sin descansos. Sin errores.
          </span>
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <a
            href="#demo"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-foreground rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 border border-primary/30"
          >
            <Bot className="mr-2 h-5 w-5" />
            Prueba a ALICIA
          </a>
          <a
            href="#planes"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-secondary rounded-xl border-2 border-secondary/50 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 hover:scale-105"
          >
            Ver Planes
          </a>
        </div>
      </div>
    </section>
  );
};

export default AliciaHero;
