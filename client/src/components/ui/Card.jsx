import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -4, borderColor: 'rgba(255,255,255,0.15)' } : {}}
      className={`
        bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6
        transition-colors ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
