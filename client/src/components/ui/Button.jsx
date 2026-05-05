import { motion } from 'framer-motion';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-white text-black hover:bg-gray-100',
  secondary: 'border border-white/30 text-white hover:bg-white/10',
  danger: 'bg-[#f87171] text-black hover:bg-red-400',
  ghost: 'text-[#a0a0a0] hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        font-['Inter'] tracking-wide transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
