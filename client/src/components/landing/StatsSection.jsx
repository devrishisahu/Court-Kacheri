import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function useCountUp(target, duration = 2200, trigger = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
}

const stats = [
  { target: 10000, label: 'Cases Filed', suffix: '+', prefix: '' },
  { target: 500, label: 'Law Firms', suffix: '+', prefix: '' },
  { target: 200, label: 'Revenue Tracked (₹L)', suffix: '+', prefix: '₹' },
  { target: 99.9, label: 'Uptime', suffix: '%', isDecimal: true, prefix: '' },
];

function StatItem({ target, label, suffix, prefix, isDecimal }) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const value = useCountUp(isDecimal ? 999 : target, 2200, inView);
  const display = isDecimal ? '99.9' : value.toLocaleString('en-IN');

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center group"
    >
      <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-['Playfair_Display'] mb-2">
        {prefix}
        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          {inView ? display : '0'}
        </span>
        <span className="text-[#d4af37]">{suffix}</span>
      </p>
      <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mx-auto mb-3" />
      <p className="text-[#606060] text-xs uppercase tracking-[0.2em] font-['Inter']">
        {label}
      </p>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-28 px-8 bg-[#080808] relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[#555555] text-xs tracking-[0.3em] font-['Inter'] uppercase mb-16"
        >
          By the numbers
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
