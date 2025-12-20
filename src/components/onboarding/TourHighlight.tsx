import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourHighlightProps {
  targetSelector: string | null;
  isActive: boolean;
}

const TourHighlight: React.FC<TourHighlightProps> = ({ targetSelector, isActive }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetSelector || !isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    updateRect();
    
    // Update on resize/scroll
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [targetSelector, isActive]);

  if (!isActive || !rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="highlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <motion.rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx="8"
                fill="black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#highlight-mask)"
          />
        </svg>

        {/* Highlight border */}
        <motion.div
          className="absolute border-2 border-primary rounded-lg shadow-lg"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(139, 92, 246, 0.4)',
              '0 0 0 8px rgba(139, 92, 246, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default TourHighlight;
