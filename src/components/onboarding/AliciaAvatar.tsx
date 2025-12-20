import React from 'react';
import { motion } from 'framer-motion';

interface AliciaAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AliciaAvatar: React.FC<AliciaAvatarProps> = ({ 
  isSpeaking, 
  isListening, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Glow effect when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Listening indicator */}
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Robot body */}
      <motion.div
        className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-lg border-2 border-primary/30 overflow-hidden"
        animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
      >
        {/* Robot face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-3 mb-2">
            <motion.div
              className="w-3 h-3 rounded-full bg-white shadow-inner"
              animate={{
                scaleY: [1, 0.1, 1],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-white shadow-inner"
              animate={{
                scaleY: [1, 0.1, 1],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          </div>

          {/* Mouth - animates when speaking */}
          <motion.div
            className="w-6 h-2 bg-white rounded-full"
            animate={isSpeaking ? {
              scaleX: [1, 1.2, 0.8, 1],
              scaleY: [1, 1.5, 0.5, 1],
            } : {}}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />
        </div>

        {/* Antenna */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <motion.div
            className="w-1.5 h-4 bg-primary rounded-t-full"
            animate={isSpeaking ? { rotateZ: [-5, 5, -5] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-white absolute -top-2 left-1/2 transform -translate-x-1/2"
            animate={{
              boxShadow: isSpeaking 
                ? ['0 0 5px #8B5CF6', '0 0 15px #8B5CF6', '0 0 5px #8B5CF6']
                : '0 0 5px #8B5CF6',
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Sound waves when speaking */}
      {isSpeaking && (
        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-primary rounded-full"
              animate={{
                height: ['8px', '16px', '8px'],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AliciaAvatar;
