'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function LuxuryAmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* 
        Light Mode Ambient:
        Subtle architectural grid and soft warm gradient glow
      */}
      <div className="absolute inset-0 block dark:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c191705_1px,transparent_1px),linear-gradient(to_bottom,#1c191705_1px,transparent_1px)] bg-[size:100px_100px] opacity-60" />
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-blue/3 blur-[120px]"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/3 blur-[150px]"
          animate={{ 
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 
        Dark Mode Ambient:
        Deep navy with royal blue bloom, architectural lines, and very subtle slow moving glow.
      */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:100px_100px] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.15),transparent_60%)]" />
        
        <motion.div 
          className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/5 blur-[120px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-10%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[150px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
