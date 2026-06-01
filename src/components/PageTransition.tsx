import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  moduleKey: string;
}

export function PageTransition({ children, moduleKey }: PageTransitionProps) {
  return (
    <motion.div
      key={moduleKey}
      initial={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: {
          duration: 0.28,
          ease: 'easeOut' as const,
        },
      }}
      exit={{
        opacity: 0,
        x: 8,
        filter: 'blur(2px)',
        transition: {
          duration: 0.16,
          ease: 'easeIn' as const,
        },
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
