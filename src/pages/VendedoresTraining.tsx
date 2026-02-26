import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import WelcomeScreen from "@/components/vendedores/WelcomeScreen";
import VendedorGameMap from "@/components/vendedores/VendedorGameMap";

type Phase = "welcome" | "game";

const VendedoresTraining = () => {
  const [phase, setPhase] = useState<Phase>("welcome");

  useEffect(() => {
    const reg = localStorage.getItem("vendedor_registered");
    if (reg === "true") setPhase("game");
  }, []);

  const handleRegistered = useCallback(() => {
    localStorage.setItem("vendedor_registered", "true");
    setPhase("game");
  }, []);

  if (phase === "welcome") {
    return <WelcomeScreen onRegistered={handleRegistered} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav */}
      <nav className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          to="/alicia"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Alicia
        </Link>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-orange-500/30">
          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-sm font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            CONEKTAO
          </span>
        </div>
      </nav>

      <VendedorGameMap />
    </div>
  );
};

export default VendedoresTraining;
