import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="py-14 px-8 bg-[#050505] border-t border-white/[0.04] relative">
      {/* Subtle gold line at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <Scale size={20} className="text-[#d4af37]" />
            <span className="text-white text-lg font-['Playfair_Display'] font-bold tracking-wide">
              Court-Kacheri
            </span>
          </motion.div>

          {/* Tagline + © */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-6 text-[#404040] text-xs font-['Inter']"
          >
            <span className="tracking-[0.1em]">Justice Demands Precision</span>
            <span className="hidden md:inline text-[#2a2a2a]">|</span>
            <span>© {new Date().getFullYear()} Court-Kacheri. All rights reserved.</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
