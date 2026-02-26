import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Mic, BarChart3, Calculator, DollarSign } from "lucide-react";
import NodeOverlay from "./NodeOverlay";
import NodeConoceAlicia from "./nodes/NodeConoceAlicia";
import NodePitchPerfecto from "./nodes/NodePitchPerfecto";
import NodeVendeConData from "./nodes/NodeVendeConData";
import NodeCalculadora from "./nodes/NodeCalculadora";
import NodeComision from "./nodes/NodeComision";
import CompletionCelebration from "./CompletionCelebration";
import { supabase } from "@/integrations/supabase/client";

type NodeId = 1 | 2 | 3 | 4 | 5;

const STORAGE_KEY = "vendedor_progress";

const getProgress = (): Set<NodeId> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? new Set(JSON.parse(data) as NodeId[]) : new Set();
  } catch {
    return new Set();
  }
};

const saveProgress = (completed: Set<NodeId>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
};

const NODE_META: { id: NodeId; label: string; doneLabel: string; emoji: string; icon: React.ElementType }[] = [
  { id: 1, label: "Conoce a Alicia", doneLabel: "Ya conoces a Alicia 🤖", emoji: "🤖", icon: Star },
  { id: 2, label: "El Pitch Perfecto", doneLabel: "Dominas el pitch 🎤", emoji: "🎤", icon: Mic },
  { id: 3, label: "Vende con Data", doneLabel: "Vendes con data 📊", emoji: "📊", icon: BarChart3 },
  { id: 4, label: "La Calculadora", doneLabel: "Calculas como pro 🧮", emoji: "🧮", icon: Calculator },
  { id: 5, label: "Tu Comisión", doneLabel: "Listo para ganar 💰", emoji: "💰", icon: DollarSign },
];

const VendedorGameMap = () => {
  const [completed, setCompleted] = useState<Set<NodeId>>(getProgress);
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [vendedorCount, setVendedorCount] = useState<number | null>(null);
  const [xpAnimating, setXpAnimating] = useState(false);

  useEffect(() => {
    supabase
      .from("vendedores" as any)
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setVendedorCount(902 + (count ?? 0)));
  }, []);

  const isUnlocked = useCallback(
    (id: NodeId) => {
      if (id === 1) return true;
      if (id === 2 || id === 3) return completed.has(1);
      if (id === 4) return completed.has(2) && completed.has(3);
      if (id === 5) return completed.has(4);
      return false;
    },
    [completed]
  );

  const getPrevNodeName = (id: NodeId): string => {
    if (id === 2 || id === 3) return "Conoce a Alicia";
    if (id === 4) return "El Pitch Perfecto y Vende con Data";
    if (id === 5) return "La Calculadora";
    return "";
  };

  const progressPercent = Math.round((completed.size / 5) * 100);

  const completeNode = useCallback(
    (id: NodeId) => {
      const next = new Set(completed);
      next.add(id);
      setCompleted(next);
      saveProgress(next);
      setActiveNode(null);

      // Save to Supabase
      const vendedorId = localStorage.getItem("vendedor_id");
      if (vendedorId) {
        supabase
          .from("vendedor_progress" as any)
          .upsert({ vendedor_id: vendedorId, nivel_completado: id } as any, { onConflict: "vendedor_id,nivel_completado" })
          .then(({ error }) => {
            if (error) console.error("Progress save error:", error);
          });
      }

      // XP animation
      setXpAnimating(true);
      setTimeout(() => setXpAnimating(false), 800);

      if (next.size === 5) {
        setTimeout(() => setShowCelebration(true), 600);
      }
    },
    [completed]
  );

  const handleNodeClick = (id: NodeId) => {
    if (isUnlocked(id) && !completed.has(id)) setActiveNode(id);
  };

  const nodePositions: { id: NodeId; x: string; y: number }[] = [
    { id: 1, x: "50%", y: 0 },
    { id: 2, x: "28%", y: 1 },
    { id: 3, x: "72%", y: 1 },
    { id: 4, x: "50%", y: 2 },
    { id: 5, x: "50%", y: 3 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-20 relative">
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-orange-400/20 animate-float-particle pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 600}px`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Método Alicia
        </h1>
        <p className="text-sm text-gray-400 mb-3">
          Completa los 5 niveles y recibe tu certificado
        </p>

        {/* XP Progress bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: xpAnimating ? 0.8 : 0.3, ease: "easeOut" }}
            />
          </div>
          <motion.span
            className="text-sm font-bold text-orange-400 whitespace-nowrap min-w-[40px] text-right"
            animate={xpAnimating ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {progressPercent}%
          </motion.span>
        </div>

        {/* Social counter */}
        {vendedorCount !== null && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span>🔥</span>
            <span className="text-xs text-gray-400">
              <span className="text-orange-400 font-bold">{vendedorCount}</span> vendedores certificados
            </span>
          </div>
        )}
      </div>

      {/* Game Map */}
      <div className="relative" style={{ height: 560 }}>
        {/* Path lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 560"
          preserveAspectRatio="xMidYMid meet"
        >
          <line x1="200" y1="55" x2="112" y2="175" stroke="#f97316" strokeWidth="2" strokeDasharray="8 6" opacity="0.3" />
          <line x1="200" y1="55" x2="288" y2="175" stroke="#f97316" strokeWidth="2" strokeDasharray="8 6" opacity="0.3" />
          <line x1="112" y1="215" x2="200" y2="325" stroke="#f97316" strokeWidth="2" strokeDasharray="8 6" opacity="0.3" />
          <line x1="288" y1="215" x2="200" y2="325" stroke="#f97316" strokeWidth="2" strokeDasharray="8 6" opacity="0.3" />
          <line x1="200" y1="365" x2="200" y2="455" stroke="#f97316" strokeWidth="2" strokeDasharray="8 6" opacity="0.3" />
        </svg>

        {nodePositions.map(({ id, x, y: row }) => {
          const meta = NODE_META.find((n) => n.id === id)!;
          const isDone = completed.has(id);
          const unlocked = isUnlocked(id);
          const Icon = meta.icon;
          const yPos = 20 + row * 140;

          return (
            <motion.button
              key={id}
              className="absolute flex flex-col items-center gap-1.5 -translate-x-1/2"
              style={{ left: x, top: yPos }}
              onClick={() => handleNodeClick(id)}
              whileTap={unlocked && !isDone ? { scale: 0.95 } : undefined}
              disabled={!unlocked || isDone}
            >
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${
                  isDone
                    ? "bg-orange-500 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    : unlocked
                    ? "bg-orange-500/10 border-orange-500 text-orange-400"
                    : "bg-white/5 border-white/10 text-gray-600"
                }`}
                animate={
                  unlocked && !isDone
                    ? {
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(249,115,22,0.3)",
                          "0 0 0 12px rgba(249,115,22,0)",
                          "0 0 0 0 rgba(249,115,22,0.3)",
                        ],
                      }
                    : undefined
                }
                transition={
                  unlocked && !isDone
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              >
                {isDone ? (
                  <Check className="w-7 h-7" strokeWidth={3} />
                ) : unlocked ? (
                  <span className="text-lg font-bold">{id}</span>
                ) : (
                  <Icon className="w-6 h-6 opacity-30 blur-[1px]" />
                )}
              </motion.div>

              {/* Label */}
              <div className="text-center max-w-[120px]">
                {isDone ? (
                  <span className="text-xs font-semibold text-orange-400 leading-tight block">
                    {meta.label} ✓
                    <br />
                    <span className="text-[10px] text-orange-300/60">{meta.doneLabel}</span>
                  </span>
                ) : unlocked ? (
                  <span className="text-xs font-semibold text-white leading-tight">{meta.label}</span>
                ) : (
                  <span className="text-[10px] text-gray-600 leading-tight block">
                    {meta.label}
                    <br />
                    <span className="text-[9px]">Se desbloquea al completar {getPrevNodeName(id)}</span>
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Node Overlays */}
      <AnimatePresence>
        {activeNode === 1 && (
          <NodeOverlay onClose={() => setActiveNode(null)}>
            <NodeConoceAlicia onComplete={() => completeNode(1)} />
          </NodeOverlay>
        )}
        {activeNode === 2 && (
          <NodeOverlay onClose={() => setActiveNode(null)}>
            <NodePitchPerfecto onComplete={() => completeNode(2)} />
          </NodeOverlay>
        )}
        {activeNode === 3 && (
          <NodeOverlay onClose={() => setActiveNode(null)}>
            <NodeVendeConData onComplete={() => completeNode(3)} />
          </NodeOverlay>
        )}
        {activeNode === 4 && (
          <NodeOverlay onClose={() => setActiveNode(null)}>
            <NodeCalculadora onComplete={() => completeNode(4)} />
          </NodeOverlay>
        )}
        {activeNode === 5 && (
          <NodeOverlay onClose={() => setActiveNode(null)}>
            <NodeComision onComplete={() => completeNode(5)} />
          </NodeOverlay>
        )}
      </AnimatePresence>

      {/* Completion Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <CompletionCelebration onClose={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendedorGameMap;
