import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      >
        {/* Background glow circle */}
        <motion.circle 
          cx="50" cy="50" r="45" 
          fill="url(#logo-grad-bg)" 
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.05, 0.95] 
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer Ring - Dynamic */}
        <motion.path
          d="M50 5 C25.1 5 5 25.1 5 50 C5 74.9 25.1 95 50 95 C74.9 95 95 74.9 95 50"
          stroke="url(#logo-grad-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 270 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* The "Flux" element - Stylized abstract wave */}
        <motion.path
          d="M30 50 Q40 30 50 50 T70 50"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />

        {/* The "Core" - Central node */}
        <motion.circle
          cx="50" cy="50" r="12"
          fill="white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
        />
        
        {/* Pulse effect on core */}
        <motion.circle
          cx="50" cy="50" r="12"
          stroke="white"
          strokeWidth="2"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />

        {/* Emerald accent bit */}
        <motion.circle
          cx="65" cy="35" r="5"
          fill="#10b981"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
        />

        <defs>
          <linearGradient id="logo-grad-primary" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id="logo-grad-bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(45)">
            <stop stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
