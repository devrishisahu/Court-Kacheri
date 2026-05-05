import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel } from 'lucide-react';

export default function Preloader({ onComplete }) {
  const [hitCount, setHitCount] = useState(0);

  useEffect(() => {
    // First hit at 0.6s
    const timer1 = setTimeout(() => setHitCount(1), 600);
    // Second hit at 1.5s
    const timer2 = setTimeout(() => setHitCount(2), 1500);
    // Complete at 3.0s
    const timer3 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  // Gavel animation: swings back, strikes, swings back, strikes
  const gavelVariants = {
    initial: { rotate: 0 },
    strike: {
      rotate: [0, -50, 5, -50, 5, 0],
      transition: { 
        duration: 1.8, 
        times: [0, 0.2, 0.33, 0.7, 0.83, 1], // Hits at ~33% (0.6s) and ~83% (1.5s)
        ease: "easeInOut",
        delay: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Glow effect behind the gavel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#d4af37] opacity-5 rounded-full blur-3xl"></div>

        {/* The Gavel */}
        <motion.div
          variants={gavelVariants}
          initial="initial"
          animate="strike"
          className="text-[#d4af37] origin-bottom-right z-10"
          style={{ transformOrigin: '80% 80%' }}
        >
          <Gavel size={100} strokeWidth={1.5} />
        </motion.div>

        {/* The Sound Block */}
        <div className="w-32 h-6 mt-[-10px] bg-[#1a1a1a] rounded-md border-b-4 border-[#111] z-0 flex items-center justify-center relative shadow-xl">
           <div className="absolute top-0 w-28 h-1 bg-[#2a2a2a] rounded-t-sm"></div>
        </div>
        
        {/* Text */}
        <div className="h-16 mt-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {hitCount === 1 && (
              <motion.h1 
                key="hit1"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(4px)' }}
                className="text-5xl font-['Playfair_Display'] font-bold text-white italic tracking-wider drop-shadow-lg"
              >
                Order!
              </motion.h1>
            )}
            {hitCount === 2 && (
              <motion.h1 
                key="hit2"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-5xl font-['Playfair_Display'] font-bold text-[#d4af37] italic tracking-wider drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                Order, Order!
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
