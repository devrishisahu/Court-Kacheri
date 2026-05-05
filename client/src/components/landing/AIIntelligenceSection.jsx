import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, FileSearch, Scale, Zap } from 'lucide-react';

export default function AIIntelligenceSection({ onOpenModal }) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.2, once: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  // Prevent hydration mismatch or random errors on first render with Math.random
  const particles = mounted ? Array.from({ length: 25 }) : [];

  return (
    <section className="relative py-32 bg-[#050505] overflow-hidden flex items-center justify-center min-h-[80vh]" ref={ref}>
      {/* Dynamic Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] md:w-[800px] h-[600px] md:h-[800px] rounded-full bg-gradient-to-tr from-[#d4af37]/20 to-[#111]/20 blur-[100px] pointer-events-none"
      />

      {/* Floating Particles */}
      {particles.map((_, i) => {
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37] rounded-full shadow-[0_0_10px_#d4af37]"
            initial={{ 
              x: startX, 
              y: startY,
              opacity: Math.random() * 0.5 + 0.1
            }}
            animate={{
              y: [startY, startY - 200 - Math.random() * 100],
              opacity: [null, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );
      })}

      <div className="container mx-auto px-6 lg:px-20 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Text */}
        <div className="flex-1 text-left">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={controls}
            variants={{
              visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#111] border border-[#2a2a2a] flex items-center justify-center text-[#d4af37]">
                <BrainCircuit size={24} />
              </div>
              <span className="text-[#d4af37] font-['JetBrains_Mono'] tracking-widest text-sm uppercase">Neural Engine Active</span>
            </div>
            
            <h2 className="text-5xl lg:text-7xl font-['Playfair_Display'] font-bold text-white mb-6 leading-tight">
              A thousand paralegals <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-amber-200 italic pr-2">in your pocket.</span>
            </h2>
            
            <p className="text-[#a0a0a0] text-lg lg:text-xl font-['Inter'] mb-8 max-w-lg leading-relaxed">
              Upload hundreds of case files, contracts, and rulings. Our proprietary AI doesn't just read them—it cross-references, extracts key arguments, and highlights contradictions in seconds.
            </p>

            <motion.button 
              onClick={onOpenModal}
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#111] border border-[#d4af37] text-[#d4af37] font-semibold rounded-full font-['Inter'] flex items-center gap-3 transition-colors hover:bg-[#d4af37] hover:text-black group cursor-pointer"
            >
              <Zap size={20} className="group-hover:fill-black" />
              Experience Court-Kacheri AI
            </motion.button>
          </motion.div>
        </div>

        {/* Right Crazy Visuals */}
        <div className="flex-1 relative h-[500px] w-full flex items-center justify-center">
          
          {/* Base Card */}
          <motion.div
            initial={{ opacity: 0, rotateY: -30, scale: 0.8 }}
            animate={controls}
            variants={{
              visible: { opacity: 1, rotateY: 0, scale: 1, transition: { duration: 1, type: "spring", bounce: 0.4 } }
            }}
            className="w-full max-w-[350px] h-[450px] bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            style={{ perspective: 1000 }}
          >
            {/* Fake text lines representing a document */}
            <div className="p-8 flex flex-col gap-5 h-full opacity-50">
              <div className="w-1/2 h-4 bg-[#2a2a2a] rounded-full mb-4" />
              <div className="w-full h-2 bg-[#2a2a2a] rounded-full" />
              <div className="w-full h-2 bg-[#2a2a2a] rounded-full" />
              <div className="w-5/6 h-2 bg-[#2a2a2a] rounded-full" />
              <div className="w-full h-2 bg-[#2a2a2a] rounded-full" />
              <div className="w-2/3 h-2 bg-[#2a2a2a] rounded-full mb-4" />
              <div className="w-full h-2 bg-[#2a2a2a] rounded-full" />
              <div className="w-4/5 h-2 bg-[#2a2a2a] rounded-full" />
              
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div className="h-24 bg-[#111] rounded-lg border border-[#2a2a2a] flex flex-col items-center justify-center gap-2">
                  <FileSearch className="text-[#555] opacity-50" size={24} />
                  <span className="text-[#555] text-xs font-['JetBrains_Mono']">Analysis</span>
                </div>
                <div className="h-24 bg-[#111] rounded-lg border border-[#2a2a2a] flex flex-col items-center justify-center gap-2">
                  <Scale className="text-[#555] opacity-50" size={24} />
                  <span className="text-[#555] text-xs font-['JetBrains_Mono']">Precedent</span>
                </div>
              </div>
            </div>

            {/* Laser Scanner */}
            <motion.div
              animate={{ top: ['-10%', '110%', '-10%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 w-full h-[2px] bg-[#d4af37] shadow-[0_0_15px_3px_#d4af37] z-20"
            />
            <motion.div
              animate={{ top: ['-10%', '110%', '-10%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#d4af37]/20 z-10 -mt-32"
            />

            {/* Floating popups overlay - Only show when in view */}
            {inView && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                  className="absolute bottom-10 right-[-10px] md:right-[-30px] bg-[#111] border border-[#d4af37] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-30"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                  <span className="text-white text-xs font-['JetBrains_Mono'] tracking-wide">Contradiction Found</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 2.5, duration: 0.5, type: "spring" }}
                  className="absolute top-1/3 left-[-10px] md:left-[-40px] bg-[#111] border border-[#2a2a2a] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-30"
                >
                  <span className="text-[#d4af37] text-xs font-['JetBrains_Mono'] tracking-wide">Extracting Clauses...</span>
                </motion.div>
              </>
            )}

          </motion.div>

        </div>
      </div>
    </section>
  );
}
