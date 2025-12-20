import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourSubtitlesProps {
  text: string;
  isVisible: boolean;
}

const TourSubtitles: React.FC<TourSubtitlesProps> = ({ text, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-6 py-4 shadow-xl">
            <p className="text-foreground text-center text-lg leading-relaxed">
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TourSubtitles;
