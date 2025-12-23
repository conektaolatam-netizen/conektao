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
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const innerSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer breathing glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full alicia-gradient opacity-30"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Speaking pulse rings */}
      {isSpeaking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[hsl(174,100%,29%)]"
            animate={{
              scale: [1, 1.4],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[hsl(25,100%,50%)]"
            animate={{
              scale: [1, 1.6],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Listening indicator ring */}
      {isListening && !isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-400"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main avatar body */}
      <motion.div
        className={`relative ${innerSizeClasses[size]} rounded-full alicia-gradient shadow-lg overflow-hidden`}
        animate={isSpeaking ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
      >
        {/* Inner dark surface */}
        <div className="absolute inset-1 rounded-full bg-[#0a0a0a] flex flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(174,100%,50%)]"
              animate={{
                scaleY: isSpeaking ? [1, 0.3, 1] : [1, 0.1, 1],
                boxShadow: [
                  '0 0 4px hsl(174,100%,50%)',
                  '0 0 8px hsl(174,100%,50%)',
                  '0 0 4px hsl(174,100%,50%)'
                ],
              }}
              transition={{
                scaleY: {
                  duration: isSpeaking ? 0.3 : 0.2,
                  repeat: Infinity,
                  repeatDelay: isSpeaking ? 0 : 3,
                },
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(174,100%,50%)]"
              animate={{
                scaleY: isSpeaking ? [1, 0.3, 1] : [1, 0.1, 1],
                boxShadow: [
                  '0 0 4px hsl(174,100%,50%)',
                  '0 0 8px hsl(174,100%,50%)',
                  '0 0 4px hsl(174,100%,50%)'
                ],
              }}
              transition={{
                scaleY: {
                  duration: isSpeaking ? 0.3 : 0.2,
                  repeat: Infinity,
                  repeatDelay: isSpeaking ? 0 : 3,
                },
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
            />
          </div>

          {/* Mouth / voice indicator */}
          <motion.div
            className="w-4 h-1 rounded-full bg-gradient-to-r from-[hsl(174,100%,40%)] to-[hsl(25,100%,50%)]"
            animate={isSpeaking ? {
              scaleX: [1, 1.3, 0.7, 1],
              scaleY: [1, 2, 0.5, 1],
            } : {
              scaleX: 1,
              scaleY: 1,
            }}
            transition={{
              duration: 0.25,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />
        </div>
      </motion.div>

      {/* Sound wave indicators when speaking */}
      {isSpeaking && (
        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full bg-gradient-to-b from-[hsl(174,100%,40%)] to-[hsl(25,100%,50%)]"
              animate={{
                height: ['6px', '14px', '6px'],
              }}
              transition={{
                duration: 0.35,
                repeat: Infinity,
                delay: i * 0.08,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AliciaAvatar;
