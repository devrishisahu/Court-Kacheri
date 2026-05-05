import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from '../../components/landing/HeroSection';
import FeaturesSection from '../../components/landing/FeaturesSection';
import AIIntelligenceSection from '../../components/landing/AIIntelligenceSection';
import FooterSection from '../../components/landing/FooterSection';
import Preloader from '../../components/landing/Preloader';
import RoleSelectionModal from '../../components/landing/RoleSelectionModal';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen">
      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {!loading && (
          <>
            <HeroSection onOpenModal={() => setIsModalOpen(true)} />
            <FeaturesSection />
            <AIIntelligenceSection onOpenModal={() => setIsModalOpen(true)} />
            <FooterSection />
          </>
        )}
      </motion.div>

      <RoleSelectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
