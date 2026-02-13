import React from "react";
import { Bot, Sparkles } from "lucide-react";

const AliciaHero = () => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* ALICIA Avatar */}
        <div className="relative mb-10">
          <div
            className="w-40 h-40 sm:w-52 sm:h-52 mx-auto rounded-full flex items-center justify-center alicia-breathing"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, hsl(174 100% 40%) 0%, hsl(174 100% 29%) 40%, hsl(25 100% 50%) 100%)",
              boxShadow:
                "0 0 80px hsl(174 100% 29% / 0.5), 0 0 160px hsl(25 100% 50% / 0.3)",
            }}
          >
            <Bot className="w-20 h-20 sm:w-28 sm:h-28 text-white drop-shadow-2xl" />
          </div>
          {/* Orbiting sparkles */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: i % 2 === 0 ? "hsl(174 100% 50%)" : "hsl(25 100% 60%)",
                top: "50%",
                left: "50%",
                animation: `orbit1 ${5 + i}s linear infinite`,
                transformOrigin: `${100 + i * 15}px ${100 + i * 15}px`,
                filter: "blur(1px)",
                opacity: 0.7,
              }}
            />
          ))}
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
