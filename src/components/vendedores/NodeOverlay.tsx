import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

const NodeOverlay = ({ children, onClose }: Props) => (
  <motion.div
    className="fixed inset-0 z-50 bg-background overflow-y-auto"
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
  >
    <button
      onClick={onClose}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-muted hover:bg-muted-foreground/10 transition-colors"
    >
      <X className="w-5 h-5 text-foreground" />
    </button>
    <div className="max-w-lg mx-auto px-4 py-12 pb-24">{children}</div>
  </motion.div>
);

export default NodeOverlay;
