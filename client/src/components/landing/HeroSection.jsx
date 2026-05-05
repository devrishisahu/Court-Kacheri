import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ChevronDown, Scale } from 'lucide-react';
import ladyJusticeImg from '../../assets/lady-justice.png';
import RoleSelectionModal from './RoleSelectionModal';
import ModelViewer from '../3d/ModelViewer';

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.4 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const curtainReveal = {
  hidden: { scaleY: 1 },
  show: { scaleY: 0, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } },
};

export default function HeroSection({ onOpenModal }) {
  const navigate = useNavigate();
  const [showCurtain, setShowCurtain] = useState(true);
  const sectionRef = useRef(null);

  // ★ Mouse-tracking parallax using Framer Motion
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for natural feel
  const springConfig = { damping: 25, stiffness: 100, mass: 0.5 };
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const translateX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  const translateY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-10, 10]), springConfig);

  // Particle layer parallax (moves opposite for depth)
  const particleX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, -20]), springConfig);
  const particleY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowCurtain(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen flex items-center justify-center bg-[#050505] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ——— CURTAIN REVEAL ——— */}
      <AnimatePresence>
        {showCurtain && (
          <motion.div
            variants={curtainReveal}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#050505] origin-top"
          />
        )}
      </AnimatePresence>

      {/* ——— 3D Background Model (Positioned on the Right) ——— */}
      <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full z-[1] pointer-events-auto">
        <ModelViewer />
      </div>

      {/* ——— BACKGROUND EFFECTS ——— */}
      {/* Radial glow behind statue */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />
      </div>

      {/* Floating particles layer — moves opposite to mouse for depth */}
      <motion.div
        style={{ x: particleX, y: particleY }}
        className="absolute inset-0 z-[1] pointer-events-none overflow-hidden"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              repeat: Infinity,
              duration: 4 + Math.random() * 3,
              delay: Math.random() * 4,
              ease: 'easeInOut',
            }}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
          />
        ))}
      </motion.div>

      {/* ——— 🗿 LADY OF JUSTICE IMAGE — Centre Stage ——— */}
      {/* ——— 🗿 LADY OF JUSTICE IMAGE — Centre Stage (Hidden since we have 3D background now) ——— */}
      {/* <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          rotateY,
          rotateX,
          x: translateX,
          y: translateY,
          perspective: 1200,
        }}
        className="absolute inset-0 z-[2] flex items-end justify-center pointer-events-none"
      >
        <img
          src={ladyJusticeImg}
          alt="Lady of Justice"
          className="h-[80vh] md:h-[88vh] object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.08)] select-none mix-blend-lighten"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 50%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 80% 80% at center, black 50%, transparent 100%)'
          }}
          draggable={false}
        />
      </motion.div> */}

      {/* ——— Glowing base ring (CSS) ——— */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute bottom-[6vh] z-[3] w-[280px] h-[30px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)] pointer-events-none"
      />

      {/* ——— CINEMATIC GRADIENT OVERLAYS ——— */}
      <div className="absolute inset-0 z-[4] bg-gradient-to-r from-[#050505] via-[#050505]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[4] bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[4] bg-gradient-to-b from-[#050505]/40 via-transparent to-transparent pointer-events-none" />

      {/* ——— TOP BAR: Big Court-Kacheri Branding ——— */}
      <div className="absolute top-0 left-0 right-0 z-20 px-8 md:px-16 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center gap-4"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
            <Scale size={22} className="text-[#d4af37]" />
          </div>
          <div>
            <span className="text-white text-xl md:text-2xl font-['Playfair_Display'] font-bold tracking-wide">
              Court-Kacheri
            </span>
            <span className="hidden md:block text-[#555555] text-[10px] font-['Inter'] tracking-[0.2em] uppercase mt-0.5">
              Legal Management System
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden md:flex items-center gap-6"
        >
          <button
            onClick={onOpenModal}
            className="text-[#808080] text-sm font-['Inter'] hover:text-white transition-colors"
          >
            Login
          </button>
          <button
            onClick={onOpenModal}
            className="bg-white/[0.06] border border-white/10 text-white text-sm font-['Inter'] px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Get Started
          </button>
        </motion.div>
      </div>

      {/* ——— HERO TEXT ——— */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-20 flex items-center pointer-events-none">
        <div className="w-full lg:w-[55%] pointer-events-auto">
          {/* Main headline */}
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="show">
            <span className="block font-['Playfair_Display'] text-5xl md:text-6xl lg:text-8xl text-white font-bold italic leading-[0.95]">
              Justice
            </span>
            <span className="block font-['Playfair_Display'] text-5xl md:text-6xl lg:text-8xl text-white font-bold mt-1 leading-[0.95]">
              Demands
            </span>
            <span className="block font-['Playfair_Display'] text-5xl md:text-6xl lg:text-8xl mt-1 leading-[0.95]">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f0d68a] to-[#d4af37] bg-clip-text text-transparent">
                Precision.
              </span>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-[#808080] text-base md:text-lg lg:text-xl max-w-lg font-['Inter'] mt-8 leading-relaxed"
          >
            Manage cases, clients, deadlines, and billing —{' '}
            <span className="text-white/70">built for the modern law firm.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex items-center gap-4 mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(212, 175, 55, 0.15)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenModal}
              className="relative bg-white text-[#0a0a0a] px-8 py-4 rounded-lg font-semibold tracking-wide font-['Inter'] overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10 group-hover:text-[#0a0a0a]">Enter the Firm</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f0d68a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, borderColor: 'rgba(212, 175, 55, 0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenModal}
              className="border border-white/20 text-white/80 px-8 py-4 rounded-lg font-['Inter'] hover:bg-white/[0.04] hover:text-white transition-all duration-300 cursor-pointer"
            >
              Sign In
            </motion.button>
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex items-center gap-6 mt-14"
          >
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-[#d4af37]/40 to-transparent" />
            <p className="text-[#555555] text-xs font-['Inter'] tracking-[0.15em] uppercase">
              Trusted by 500+ law firms across India
            </p>
          </motion.div>
        </div>
      </div>

      {/* ——— SCROLL INDICATOR ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[#555555] text-[10px] font-['Inter'] tracking-[0.3em] uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-[#555555]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
