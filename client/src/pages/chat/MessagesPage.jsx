import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { MessageSquare, Calendar, Trash2, ShieldCheck, ArrowRight, Clock, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function MessagesPage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'requests'

  const fetchMeetings = async () => {
    try {
      let endpoint = '/meetings/client';
      if (user.role === 'admin') endpoint = '/meetings/firm';
      else if (user.role === 'lawyer') endpoint = '/meetings/lawyer';

      const res = await api.get(endpoint);
      setMeetings(res.data.data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDeleteChat = async (id) => {
    if (!window.confirm('Delete this chat session?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Chat deleted');
      fetchMeetings();
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const handleRespond = async (id, status) => {
    try {
      const endpoint = user.role === 'admin' ? `/meetings/${id}/status` : `/meetings/lawyer/${id}/status`;
      await api.patch(endpoint, { status });
      toast.success(`Request ${status}`);
      fetchMeetings();
    } catch {
      toast.error('Failed to respond');
    }
  };

  const acceptedChats = meetings.filter(m => m.status === 'accepted');
  const pendingRequests = meetings.filter(m => m.status === 'pending');

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">Messages</h1>
          <p className="text-[#a0a0a0] text-sm mt-1">Secure communication with your firm and clients.</p>
        </motion.div>

        <div className="flex p-1 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-fit">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`px-6 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'chats' ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
          >
            Active Chats ({acceptedChats.length})
          </button>
          {(user.role === 'admin' || user.role === 'lawyer') && (
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'requests' ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
            >
              Requests ({pendingRequests.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#111] animate-pulse rounded-2xl border border-[#2a2a2a]" />)}
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'chats' ? (
            acceptedChats.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-[#1a1a1a] rounded-3xl">
                <MessageSquare className="mx-auto text-[#2a2a2a] mb-4" size={48} />
                <p className="text-[#555] font-['Inter']">No active chat sessions.</p>
              </div>
            ) : (
              acceptedChats.map(m => (
                <motion.div key={m._id} variants={fadeUp}>
                  <Card className="hover:border-white/20 transition-all cursor-pointer group" onClick={() => navigate(`/chat/${m._id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-bold text-lg">
                          {user.role === 'client' ? (m.lawyerId?.name?.[0] || m.firmId?.name?.[0]) : m.clientId?.name?.[0]}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg group-hover:text-[#d4af37] transition-colors">
                            {user.role === 'client' 
                              ? (m.lawyerId?.name || m.firmId?.name) 
                              : (user.role === 'admin' 
                                ? `${m.lawyerId?.name || 'Firm Admin'} ↔ ${m.clientId?.name}`
                                : m.clientId?.name)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="neutral" className="text-[10px]">
                              {user.role === 'client' 
                                ? (m.lawyerId ? 'Lawyer' : 'Firm') 
                                : (user.role === 'admin' ? 'Internal Session' : 'Client')}
                            </Badge>
                            {m.unreadCount > 0 && <Badge variant="success">{m.unreadCount} New</Badge>}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteChat(m._id); }}
                        className="text-[#333] hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                      <span className="text-[#555] text-xs flex items-center gap-1.5">
                        <Clock size={12} /> Active since {new Date(m.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[#d4af37] text-xs font-bold uppercase tracking-tighter flex items-center gap-1">
                        Enter Room <ArrowRight size={14} />
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))
            )
          ) : (
            pendingRequests.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-[#1a1a1a] rounded-3xl">
                <Calendar className="mx-auto text-[#2a2a2a] mb-4" size={48} />
                <p className="text-[#555] font-['Inter']">No pending meeting requests.</p>
              </div>
            ) : (
              pendingRequests.map(m => (
                <motion.div key={m._id} variants={fadeUp}>
                  <Card className="border-[#d4af37]/20 bg-[#d4af37]/5">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                          {m.clientId?.name?.[0]}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{m.clientId?.name}</h3>
                          <p className="text-[#a0a0a0] text-xs">{m.clientId?.email}</p>
                          <div className="mt-2 p-3 bg-black/40 rounded-lg text-[#a0a0a0] text-sm italic">
                            "{m.message}"
                          </div>
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <Button className="flex-1" onClick={() => handleRespond(m._id, 'accepted')}>Accept</Button>
                      <Button variant="secondary" className="flex-1" onClick={() => handleRespond(m._id, 'rejected')}>Decline</Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )
          )}
        </motion.div>
      )}

      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
        <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        <div>
          <p className="text-white text-sm font-bold">End-to-End Encrypted</p>
          <p className="text-[#a0a0a0] text-xs mt-0.5">All communications between clients and firms are strictly confidential and secure.</p>
        </div>
      </div>
    </div>
  );
}
