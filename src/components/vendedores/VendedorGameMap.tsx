import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock } from "lucide-react";
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

const NODE_META: { id: NodeId; label: string; subtitle: string }[] = [
  { id: 1, label: "Conoce a Alicia", subtitle: "Tu asistente de ventas con IA" },
  { id: 2, label: "Convence en Poco Tiempo", subtitle: "Dos técnicas para cerrar la venta" },
  { id: 3, label: "Vende con Data", subtitle: "Usa datos reales para convencer" },
  { id: 4, label: "La Calculadora", subtitle: "Calcula el ROI del restaurante" },
  { id: 5, label: "Tu Comisión", subtitle: "Cómo ganar dinero vendiendo" },
];

const getPrevNodeName = (id: NodeId): string => {
  if (id === 2 || id === 3) return "Conoce a Alicia";
  if (id === 4) return "Convence en Poco Tiempo y Vende con Data";
  if (id === 5) return "La Calculadora";
  return "";
};

const VendedorGameMap = () => {
  const [completed, setCompleted] = useState<Set<NodeId>>(getProgress);
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [vendedorCount, setVendedorCount] = useState<number | null>(null);

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

  const progressPercent = Math.round((completed.size / 5) * 100);

  const completeNode = useCallback(
    (id: NodeId) => {
      const next = new Set(completed);
      next.add(id);
      setCompleted(next);
      saveProgress(next);
      setActiveNode(null);

      const vendedorId = localStorage.getItem("vendedor_id");
      if (vendedorId) {
        supabase
          .from("vendedor_progress" as any)
          .upsert({ vendedor_id: vendedorId, nivel_completado: id } as any, { onConflict: "vendedor_id,nivel_completado" })
          .then(({ error }) => {
            if (error) console.error("Progress save error:", error);
          });
      }

      if (next.size === 5) {
        setTimeout(() => setShowCelebration(true), 600);
      }
    },
    [completed]
  );

  const handleNodeClick = (id: NodeId) => {
    if (isUnlocked(id) && !completed.has(id)) setActiveNode(id);
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden"
      style={{ background: "#000000" }}
    >
      {/* Background orbs — mixed orange + turquoise */}
      <div className="gm-orb gm-orb-a1" />
      <div className="gm-orb gm-orb-a2" />
      <div className="gm-orb gm-orb-a3" />
      <div className="gm-orb gm-orb-a4" />
      <div className="gm-orb gm-orb-b1" />
      <div className="gm-orb gm-orb-b2" />
      <div className="gm-orb gm-orb-b3" />

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Método Alicia</h1>
          <p className="text-sm text-gray-500 mb-4">
            Completa los 5 niveles y recibe tu certificado
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(to right, #F59E0B, #F97316)",
                  boxShadow: "0 0 12px rgba(249,115,22,0.5)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: "#F97316" }}>
              {progressPercent}%
            </span>
          </div>

          {/* Social counter */}
          {vendedorCount !== null && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(249,115,22,0.06)",
                border: "1px solid rgba(249,115,22,0.3)",
              }}
            >
              <span className="gm-flame-pulse">🔥</span>
              <span className="text-xs text-white">
                <span className="font-bold" style={{ color: "#F97316" }}>{vendedorCount}</span>{" "}
                vendedores certificados
              </span>
            </div>
          )}
        </div>

        {/* Vertical node path */}
        <div className="flex flex-col items-center gap-0">
          {NODE_META.map((meta, index) => {
            const isDone = completed.has(meta.id);
            const unlocked = isUnlocked(meta.id);

            return (
              <React.Fragment key={meta.id}>
                {/* Dashed connector line */}
                {index > 0 && (
                  <div
                    className="w-[2px] h-10"
                    style={{
                      backgroundImage: "linear-gradient(to bottom, rgba(249,115,22,0.4) 50%, transparent 50%)",
                      backgroundSize: "2px 8px",
                    }}
                  />
                )}

                {/* Node */}
                <motion.button
                  className="flex flex-col items-center gap-2 py-2"
                  onClick={() => handleNodeClick(meta.id)}
                  whileTap={unlocked && !isDone ? { scale: 1.08 } : undefined}
                  transition={{ type: "spring", damping: 12, stiffness: 300, duration: 0.2 }}
                  disabled={!unlocked || isDone}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {/* Circle */}
                  {isDone ? (
                    <div
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                      style={{
                        background: "radial-gradient(circle at 40% 35%, #22C55E, #15803D)",
                        boxShadow: "0 0 0 4px rgba(34,197,94,0.3), 0 0 20px rgba(34,197,94,0.35)",
                      }}
                    >
                      <Check className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                  ) : unlocked ? (
                    <motion.div
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(249,115,22,0.12)",
                        border: "2px solid #F97316",
                      }}
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-xl font-bold" style={{ color: "#F97316" }}>
                        {meta.id}
                      </span>
                    </motion.div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Lock className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  {/* Label */}
                  <div className="text-center max-w-[200px]">
                    {isDone ? (
                      <>
                        <p className="text-[15px] font-bold" style={{ color: "#22C55E" }}>
                          {meta.label} ✓
                        </p>
                        <p className="text-xs text-gray-500">{meta.subtitle}</p>
                      </>
                    ) : unlocked ? (
                      <>
                        <p className="text-[15px] font-bold text-white">{meta.label}</p>
                        <p className="text-xs text-gray-500">{meta.subtitle}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] text-gray-600">{meta.label}</p>
                        <p className="text-[11px] text-gray-700 italic">
                          Se desbloquea al completar {getPrevNodeName(meta.id)}
                        </p>
                      </>
                    )}
                  </div>
                </motion.button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom hint */}
        <p className="text-center mt-10" style={{ fontSize: 13, color: "#888888" }}>
          ¿Tienes alguna duda? Escríbele a Alicia por WhatsApp 💬
        </p>
      </div>

      {/* Node Overlays */}
      <AnimatePresence>
        {activeNode === 1 && (
          <NodeOverlay onClose={() => setActiveNode(null)} fullScreen>
            <NodeConoceAlicia onComplete={() => completeNode(1)} onClose={() => setActiveNode(null)} />
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

      <AnimatePresence>
        {showCelebration && (
          <CompletionCelebration onClose={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      <style>{`
        .gm-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }
        /* Orange orbs */
        .gm-orb-a1 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%);
          top: 5%; left: 10%;
          animation: gmOrbA1 24s ease-in-out infinite;
        }
        .gm-orb-a2 {
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%);
          top: 35%; right: 5%;
          animation: gmOrbA2 20s ease-in-out infinite;
        }
        .gm-orb-a3 {
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%);
          bottom: 20%; left: 15%;
          animation: gmOrbA3 28s ease-in-out infinite;
        }
        .gm-orb-a4 {
          width: 80px; height: 80px;
          background: radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%);
          top: 65%; right: 20%;
          animation: gmOrbA4 22s ease-in-out infinite;
        }
        /* Turquoise orbs */
        .gm-orb-b1 {
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(20,184,166,0.05), transparent 70%);
          top: 15%; right: 15%;
          animation: gmOrbB1 26s ease-in-out infinite;
        }
        .gm-orb-b2 {
          width: 140px; height: 140px;
          background: radial-gradient(circle, rgba(20,184,166,0.05), transparent 70%);
          bottom: 35%; left: 5%;
          animation: gmOrbB2 30s ease-in-out infinite;
        }
        .gm-orb-b3 {
          width: 100px; height: 100px;
          background: radial-gradient(circle, rgba(20,184,166,0.05), transparent 70%);
          bottom: 10%; right: 10%;
          animation: gmOrbB3 23s ease-in-out infinite;
        }

        @keyframes gmOrbA1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,20px)} 66%{transform:translate(-15px,10px)} }
        @keyframes gmOrbA2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,-30px)} }
        @keyframes gmOrbA3 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(20px,-15px)} 80%{transform:translate(-10px,25px)} }
        @keyframes gmOrbA4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,15px)} }
        @keyframes gmOrbB1 { 0%,100%{transform:translate(0,0)} 35%{transform:translate(-20px,25px)} 70%{transform:translate(15px,-10px)} }
        @keyframes gmOrbB2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(25px,-20px)} }
        @keyframes gmOrbB3 { 0%,100%{transform:translate(0,0)} 45%{transform:translate(-15px,-20px)} 85%{transform:translate(10px,15px)} }

        .gm-flame-pulse {
          display: inline-block;
          animation: flamePulse 2s ease-in-out infinite;
        }
        @keyframes flamePulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default VendedorGameMap;
