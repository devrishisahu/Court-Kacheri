import { motion } from 'framer-motion';
import { Scale, Users, Calendar, Clock, Receipt, FileText } from 'lucide-react';

const features = [
  {
    icon: Scale,
    title: 'Case Management',
    description: 'Track every case from filing to verdict. Filter, search, assign lawyers, and monitor status in real-time.',
  },
  {
    icon: Users,
    title: 'Client Registry',
    description: 'Maintain a complete client database with contact history, linked cases, and billing at a glance.',
  },
  {
    icon: Calendar,
    title: 'Smart Deadlines',
    description: 'Never miss a hearing date. Built-in conflict detection and intelligent timeline views.',
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    description: 'Start/stop live timers per case. Billable hours auto-calculated and ready for invoicing.',
  },
  {
    icon: Receipt,
    title: 'Billing & Invoices',
    description: 'Generate invoices from time entries or manual line items. Track payment status with ease.',
  },
  {
    icon: FileText,
    title: 'Document Vault',
    description: 'Securely upload and access case documents. Drag-and-drop interface. PDF and DOCX.',
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 60 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function FeaturesSection() {
  return (
    <section className="py-32 px-8 md:px-16 bg-[#050505] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(176,196,255,0.02)_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 mb-6"
          >
            <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
            <span className="text-[#808080] text-[10px] tracking-[0.2em] font-['Inter'] uppercase">Capabilities</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-['Playfair_Display']"
          >
            Everything a{' '}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f0d68a] to-[#d4af37] bg-clip-text text-transparent">
              Firm
            </span>{' '}
            Needs.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#606060] text-base md:text-lg font-['Inter'] mt-5 max-w-lg mx-auto"
          >
            Six powerful modules. One unified platform. Zero compromises.
          </motion.p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              custom={idx}
              variants={cardVariant}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              whileHover={{ y: -6, borderColor: 'rgba(212, 175, 55, 0.15)' }}
              className="group bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 relative overflow-hidden transition-colors duration-300 cursor-default"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.04)_0%,_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-6 group-hover:border-[#d4af37]/20 transition-colors duration-300">
                  <feature.icon size={22} className="text-[#d4af37] opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-white font-['Playfair_Display'] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#707070] text-sm font-['Inter'] leading-relaxed group-hover:text-[#909090] transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
