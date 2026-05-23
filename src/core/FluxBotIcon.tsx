import React from "react";
import { motion } from "framer-motion";

export function FluxBotIcon({ size = 24, active = false }: { size?: number, active?: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-indigo-500 rounded-full blur-[10px]"
      />

      {/* Rotating Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-[1.5px] border-emerald-500/30 rounded-full"
      />
      
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[3px] border-[1.5px] border-indigo-400/20 rounded-full border-dashed"
      />

      {/* The Core */}
      <motion.div 
        animate={active ? {
            scale: [1, 1.1, 1],
            boxShadow: [
                "0 0 10px rgba(99, 102, 241, 0.4)",
                "0 0 20px rgba(99, 102, 241, 0.8)",
                "0 0 10px rgba(99, 102, 241, 0.4)"
            ]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative z-10 w-[70%] h-[70%] bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
      >
        {/* Shine effect */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 transform pointer-events-none" />
        
        {/* "Eye" / Central Node */}
        <div className="w-[40%] h-[40%] bg-slate-950 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
           <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               opacity: [0.7, 1, 0.7]
             }}
             transition={{ duration: 2, repeat: Infinity }}
             className="w-[50%] h-[50%] bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
           />
        </div>
      </motion.div>

      {/* Particle Bits */}
      <AnimatePresence>
        {active && [0, 1, 2].map((i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                    x: (Math.random() - 0.5) * size * 2,
                    y: (Math.random() - 0.5) * size * 2
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.6,
                    ease: "easeOut"
                }}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full blur-[0.5px]"
            />
        ))}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence } from "framer-motion";
