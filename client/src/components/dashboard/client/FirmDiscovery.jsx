import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Users, Star, ArrowRight } from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FirmDiscovery({ onRequestMeeting, clientMeetings = [] }) {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/public/firms?search=${search}`);
      setFirms(data.data);
    } catch (err) {
      toast.error('Failed to load firms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchFirms, 300);
    return () => clearTimeout(t);
  }, [search]);

  const viewLawyers = async (firm) => {
    setSelectedFirm(firm);
    setLoadingLawyers(true);
    try {
      const { data } = await api.get(`/public/firms/${firm._id}/lawyers`);
      setLawyers(data.data);
    } catch (err) {
      toast.error('Failed to load lawyers');
    } finally {
      setLoadingLawyers(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">Legal Firm Discovery</h2>
          <p className="text-[#555555] text-sm mt-1">Discover and connect with top legal practices</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firms by name..."
            className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#555555] text-sm focus:outline-none focus:border-[#d4af37]/50 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#111111] rounded-2xl animate-pulse border border-[#2a2a2a]" />)}
        </div>
      ) : firms.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] rounded-2xl border border-[#2a2a2a]">
          <Building2 size={48} className="mx-auto text-[#2a2a2a] mb-4" />
          <p className="text-[#a0a0a0]">No firms found matching your search</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden" animate="visible" 
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {firms.map((firm) => {
            const existingFirmMeeting = clientMeetings.find(m => (!m.lawyerId) && (m.firmId?._id === firm._id || m.firmId === firm._id));
            const isConnected = existingFirmMeeting?.status === 'accepted';
            const isPending = existingFirmMeeting?.status === 'pending';

            return (
            <motion.div key={firm._id} variants={fadeUp}>
              <Card className="h-full flex flex-col p-8 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/10 transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-[#d4af37] text-sm font-bold">
                    <Star size={14} fill="currentColor" />
                    {firm.rating || '4.5'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white font-['Playfair_Display'] mb-2">{firm.name}</h3>
                <p className="text-[#555555] text-sm font-['Inter'] line-clamp-2 mb-6">
                  {firm.description || 'Top-tier legal firm providing comprehensive representation and strategic advisory services.'}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-[#a0a0a0] text-xs uppercase tracking-widest font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      {firm.lawyerCount} Lawyers
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => viewLawyers(firm)}
                    >
                      View Team
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="sm"
                      disabled={isConnected || isPending}
                      onClick={() => onRequestMeeting(firm)}
                    >
                      {isConnected ? 'Connected' : isPending ? 'Pending' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )})}
        </motion.div>
      )}

      {/* Lawyers Modal */}
      <Modal 
        isOpen={!!selectedFirm} 
        onClose={() => setSelectedFirm(null)}
        title={`${selectedFirm?.name} — Legal Team`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {loadingLawyers ? (
            [1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
          ) : lawyers.length === 0 ? (
            <p className="text-center py-10 text-[#555555]">No active lawyers found in this firm.</p>
          ) : (
            lawyers.map(l => {
              const existingMeeting = clientMeetings.find(m => m.lawyerId?._id === l._id || m.lawyerId === l._id);
              const isConnected = existingMeeting?.status === 'accepted';
              const isPending = existingMeeting?.status === 'pending';
              return (
              <div key={l._id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-[#d4af37]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-bold">
                    {l.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{l.name}</p>
                    <p className="text-[#555] text-xs">Advocate • Senior Associate</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedFirm(null);
                    onRequestMeeting(selectedFirm, l);
                  }}
                  disabled={isConnected || isPending}
                  className={`p-2 transition-colors ${isConnected || isPending ? 'text-[#555] cursor-not-allowed opacity-50' : 'text-[#555] hover:text-[#d4af37]'}`}
                >
                  {isConnected ? 'Connected' : isPending ? 'Pending' : <ArrowRight size={18} />}
                </button>
              </div>
            )})
          )}
        </div>
      </Modal>
    </div>
  );
}
