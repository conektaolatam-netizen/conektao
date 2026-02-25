import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import VendedorRegistration from "@/components/vendedores/VendedorRegistration";
import VendedorGameMap from "@/components/vendedores/VendedorGameMap";

const VendedoresTraining = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const reg = localStorage.getItem("vendedor_registered");
    if (reg === "true") setIsRegistered(true);
  }, []);

  const handleRegistered = useCallback(() => {
    localStorage.setItem("vendedor_registered", "true");
    setIsRegistered(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          to="/alicia"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Alicia
        </Link>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-xl rounded-full border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CONEKTAO
          </span>
        </div>
      </nav>

      {!isRegistered ? (
        <VendedorRegistration onComplete={handleRegistered} />
      ) : (
        <VendedorGameMap />
      )}
    </div>
  );
};

export default VendedoresTraining;
