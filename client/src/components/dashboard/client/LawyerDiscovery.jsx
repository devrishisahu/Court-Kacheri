import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Gavel, ArrowRight, Building2 } from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function LawyerDiscovery({ onRequestMeeting, clientMeetings = [] }) {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/public/lawyers');
      setLawyers(data.data);
    } catch (err) {
      toast.error('Failed to load lawyers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const filteredLawyers = lawyers.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    (l.firmId?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">Lawyer Discovery</h2>
          <p className="text-[#555555] text-sm mt-1">Find the right advocate for your case directly</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lawyers or firms..."
            className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#555555] text-sm focus:outline-none focus:border-[#d4af37]/50 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[#111111] rounded-2xl animate-pulse border border-[#2a2a2a]" />)}
        </div>
      ) : filteredLawyers.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] rounded-2xl border border-[#2a2a2a]">
          <Gavel size={48} className="mx-auto text-[#2a2a2a] mb-4" />
          <p className="text-[#a0a0a0]">No lawyers found matching your search</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden" animate="visible" 
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredLawyers.map((lawyer) => {
            const existingMeeting = clientMeetings.find(m => m.lawyerId?._id === lawyer._id || m.lawyerId === lawyer._id);
            const isConnected = existingMeeting?.status === 'accepted';
            const isPending = existingMeeting?.status === 'pending';

            return (
            <motion.div key={lawyer._id} variants={fadeUp}>
              <Card className="h-full flex flex-col p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6] font-bold">
                      {lawyer.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-['Playfair_Display']">{lawyer.name}</h3>
                      <div className="flex items-center gap-1.5 text-[#555] text-xs mt-1">
                        <Building2 size={12} />
                        {lawyer.firmId?.name || 'Independent'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={isConnected || isPending}
                    onClick={() => onRequestMeeting(lawyer.firmId, lawyer)}
                  >
                    {isConnected ? 'Connected' : isPending ? 'Request Pending' : 'Request Meeting'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )})}
        </motion.div>
      )}
    </div>
  );
}
