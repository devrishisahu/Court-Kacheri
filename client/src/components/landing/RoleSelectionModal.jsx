import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Gavel, User, ArrowRight } from 'lucide-react';

const roles = [
  {
    id: 'admin',
    title: 'Firm',
    description: 'Manage law firm',
    icon: Briefcase,
    color: '#d4af37',
  },
  {
    id: 'lawyer',
    title: 'Lawyer',
    description: 'Case & Time tracking',
    icon: Gavel,
    color: '#8b5cf6',
  },
  {
    id: 'client',
    title: 'Client',
    description: 'Legal Marketplace',
    icon: User,
    color: '#10b981',
  },
];

export default function RoleSelectionModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleAction = (type) => {
    if (!selectedRole) return;
    navigate(`/${type}?role=${selectedRole}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden"
          >
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#d4af37]/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10 text-center mb-12">
              <h2 className="text-4xl font-['Playfair_Display'] font-bold text-white mb-3 italic">Identity Choice</h2>
              <p className="text-[#555555] font-['Inter'] text-sm tracking-widest uppercase">How will you enter the Court-Kacheri?</p>
            </div>

            {/* Circular Row Layout */}
            <div className="flex flex-row items-center justify-center gap-8 md:gap-12 mb-16">
              {roles.map((role) => (
                <div key={role.id} className="flex flex-col items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, y: -10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedRole(role.id)}
                    className={`
                      relative w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer border-2
                      ${selectedRole === role.id 
                        ? 'bg-white border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.2)]' 
                        : 'bg-white/[0.03] border-white/10 hover:border-white/30'}
                    `}
                  >
                    <role.icon 
                      size={selectedRole === role.id ? 36 : 30} 
                      className="transition-all"
                      style={{ 
                        color: role.color,
                        filter: selectedRole === role.id ? 'none' : 'grayscale(0.4) brightness(0.8)'
                      }}
                    />
                    <span 
                      className={`text-[10px] font-bold uppercase tracking-tighter mt-2 transition-colors`}
                      style={{ color: selectedRole === role.id ? '#000' : `${role.color}88` }}
                    >
                      {role.title}
                    </span>

                    {/* Selected Indicator Ring */}
                    {selectedRole === role.id && (
                      <motion.div 
                        layoutId="ring"
                        className="absolute -inset-3 rounded-full border-2"
                        style={{ borderColor: `${role.color}44` }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      />
                    )}
                  </motion.div>
                  <p className={`text-[10px] text-center w-24 font-['Inter'] transition-all duration-300 ${selectedRole === role.id ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}
                     style={{ color: role.color }}>
                    {role.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex w-full max-w-md gap-4">
                <button
                  disabled={!selectedRole}
                  onClick={() => handleAction('register')}
                  className={`
                    flex-1 py-4 rounded-full font-bold tracking-wider font-['Inter'] transition-all flex items-center justify-center gap-2
                    ${selectedRole 
                      ? 'bg-white text-black hover:bg-[#d4af37] shadow-xl' 
                      : 'bg-white/5 text-[#444] cursor-not-allowed border border-white/5'}
                  `}
                >
                  Register <ArrowRight size={16} />
                </button>
                <button
                  disabled={!selectedRole}
                  onClick={() => handleAction('login')}
                  className={`
                    flex-1 py-4 rounded-full font-bold tracking-wider font-['Inter'] border transition-all
                    ${selectedRole 
                      ? 'border-white/20 text-white hover:bg-white/[0.05]' 
                      : 'border-white/5 text-[#444] cursor-not-allowed'}
                  `}
                >
                  Login
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-[#555555] text-xs hover:text-white transition-colors uppercase tracking-[0.2em] font-bold"
              >
                Dismiss
              </button>
            </div>

            {/* Bottom Glow Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
