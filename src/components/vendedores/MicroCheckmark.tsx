import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  label: string;
  show: boolean;
}

const MicroCheckmark = ({ label, show }: Props) => {
  if (!show) return null;

  return (
    <motion.div
      className="flex items-center gap-2 py-3"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: [0.5, 1.2, 1] }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </div>
      <span className="text-sm font-semibold text-orange-400">{label}</span>
    </motion.div>
  );
};

export default MicroCheckmark;
