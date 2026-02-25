import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Star, Mic, BarChart3, Calculator, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import NodeOverlay from "./NodeOverlay";
import NodeConoceAlicia from "./nodes/NodeConoceAlicia";
import NodePitchPerfecto from "./nodes/NodePitchPerfecto";
import NodeVendeConData from "./nodes/NodeVendeConData";
import NodeCalculadora from "./nodes/NodeCalculadora";
import NodeComision from "./nodes/NodeComision";
import CompletionCelebration from "./CompletionCelebration";

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

const NODE_META: { id: NodeId; label: string; icon: React.ElementType }[] = [
  { id: 1, label: "Conoce a Alicia", icon: Star },
  { id: 2, label: "El Pitch Perfecto", icon: Mic },
  { id: 3, label: "Vende con Data", icon: BarChart3 },
  { id: 4, label: "La Calculadora", icon: Calculator },
  { id: 5, label: "Tu Comisión", icon: DollarSign },
];

const VendedorGameMap = () => {
  const [completed, setCompleted] = useState<Set<NodeId>>(getProgress);
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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

  const progressPercent = Math.round((completed.size / 5) * 100);

  const completeNode = useCallback(
    (id: NodeId) => {
      const next = new Set(completed);
      next.add(id);
      setCompleted(next);
      saveProgress(next);
      setActiveNode(null);
      if (next.size === 5) {
        setTimeout(() => setShowCelebration(true), 400);
      }
    },
    [completed]
  );

  const handleNodeClick = (id: NodeId) => {
    if (isUnlocked(id)) setActiveNode(id);
  };

  // Layout positions for the map nodes (mobile-first vertical layout)
  const nodePositions: { id: NodeId; x: string; y: number }[] = [
    { id: 1, x: "50%", y: 0 },
    { id: 2, x: "28%", y: 1 },
    { id: 3, x: "72%", y: 1 },
    { id: 4, x: "50%", y: 2 },
    { id: 5, x: "50%", y: 3 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-20">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          Método Alicia
        </h1>
        <p className="text-sm text-muted-foreground mb-3">
          Completa los 5 niveles para convertirte en vendedor
        </p>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="h-3 flex-1" />
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Game Map */}
      <div className="relative" style={{ height: 520 }}>
        {/* Dotted path lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 520"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Node 1 → Node 2 */}
          <line x1="200" y1="55" x2="112" y2="165" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
          {/* Node 1 → Node 3 */}
          <line x1="200" y1="55" x2="288" y2="165" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
          {/* Node 2 → Node 4 */}
          <line x1="112" y1="205" x2="200" y2="305" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
          {/* Node 3 → Node 4 */}
          <line x1="288" y1="205" x2="200" y2="305" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
          {/* Node 4 → Node 5 */}
          <line x1="200" y1="345" x2="200" y2="435" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
        </svg>

        {nodePositions.map(({ id, x, y: row }) => {
          const meta = NODE_META.find((n) => n.id === id)!;
          const isDone = completed.has(id);
          const unlocked = isUnlocked(id);
          const Icon = meta.icon;
          const yPos = 20 + row * 130;

          return (
            <motion.button
              key={id}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2"
              style={{ left: x, top: yPos }}
              onClick={() => handleNodeClick(id)}
              whileTap={unlocked ? { scale: 0.95 } : undefined}
              disabled={!unlocked}
            >
              <motion.div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center border-[3px] transition-colors ${
                  isDone
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : unlocked
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted border-muted-foreground/30 text-muted-foreground"
                }`}
                animate={
                  unlocked && !isDone
                    ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.3)", "0 0 0 12px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0.3)"] }
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
                  <Icon className="w-7 h-7" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </motion.div>
              <span
                className={`text-xs font-semibold text-center max-w-[100px] leading-tight ${
                  isDone
                    ? "text-primary"
                    : unlocked
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {meta.label}
              </span>
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
