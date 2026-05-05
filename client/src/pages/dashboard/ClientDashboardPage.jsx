import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  Scale, 
  Calendar, 
  FileText,
  AlertCircle,
  Receipt,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import FirmDiscovery from '../../components/dashboard/client/FirmDiscovery';
import LawyerDiscovery from '../../components/dashboard/client/LawyerDiscovery';
import MeetingRequestModal from '../../components/dashboard/client/MeetingRequestModal';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const formatDate = (d) => 
  new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ClientDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState([
    { label: 'Active Cases', value: '0', icon: Scale },
    { label: 'Pending Invoices', value: '0', icon: Receipt },
    { label: 'Upcoming Meetings', value: '0', icon: Calendar },
    { label: 'Documents', value: '0', icon: FileText },
  ]);
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState({ firm: null, lawyer: null });
  const [activeTab, setActiveTab] = useState('lawyers');

  const fetchOverview = async () => {
    try {
      const [casesRes, invoicesRes, meetingsRes] = await Promise.all([
        api.get('/cases?limit=1'),
        api.get('/billing?limit=1'),
        api.get('/meetings/client'),
      ]);

      setMeetings(meetingsRes.data.data);
      setStats([
        { label: 'Active Cases', value: casesRes.data.meta?.total || '0', icon: Scale },
        { label: 'Pending Invoices', value: invoicesRes.data.meta?.total || '0', icon: Receipt },
        { label: 'Meetings', value: meetingsRes.data.data.filter(m => m.status === 'pending').length, icon: Calendar },
        { label: 'Documents', value: '0', icon: FileText },
      ]);
    } catch (err) {
      console.error('Failed to fetch overview data');
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDeleteChat = async (id) => {
    if (!window.confirm('Delete this entire chat session and disconnect? You can request a new meeting later.')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Connection reset successfully');
      fetchOverview();
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  const openMeetingModal = (firm, lawyer = null) => {
    setSelectedRequest({ firm, lawyer });
    setShowMeetingModal(true);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="text-4xl font-bold text-white font-['Playfair_Display'] italic">
            Dashboard
          </h1>
          <p className="text-[#a0a0a0] mt-2 font-['Inter']">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span>. Manage your legal affairs.
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        initial="hidden" animate="visible" 
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="p-6 rounded-2xl bg-[#111111] border border-[#2a2a2a] group hover:border-[#d4af37]/30 transition-all"
          >
            <div className={`p-3 w-fit rounded-xl bg-white/5 text-white group-hover:text-[#d4af37] transition-colors mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[#555] text-xs font-['Inter'] uppercase tracking-widest font-bold">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1 font-['Playfair_Display']">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Marketplace Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex gap-4 border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveTab('lawyers')}
              className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${
                activeTab === 'lawyers' ? 'text-[#d4af37] border-[#d4af37]' : 'text-[#555] border-transparent hover:text-white'
              }`}
            >
              Lawyers
            </button>
            <button
              onClick={() => setActiveTab('firms')}
              className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${
                activeTab === 'firms' ? 'text-[#d4af37] border-[#d4af37]' : 'text-[#555] border-transparent hover:text-white'
              }`}
            >
              Firms
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all relative ${
                activeTab === 'chats' ? 'text-[#d4af37] border-[#d4af37]' : 'text-[#555] border-transparent hover:text-white'
              }`}
            >
              Active Chats
              {meetings.some(m => m.unreadCount > 0) && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
          {activeTab === 'firms' && <FirmDiscovery onRequestMeeting={openMeetingModal} clientMeetings={meetings} />}
          {activeTab === 'lawyers' && <LawyerDiscovery onRequestMeeting={openMeetingModal} clientMeetings={meetings} />}
          {activeTab === 'chats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meetings.filter(m => m.status === 'accepted').map(m => (
                <div key={m._id} className="p-6 bg-[#111111] rounded-2xl border border-[#2a2a2a] group hover:border-[#d4af37]/30 transition-all relative">
                  {m.unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-bounce">
                      {m.unreadCount} NEW
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981] font-bold">
                      {m.lawyerId?.name?.[0] || 'L'}
                    </div>
                    <div>
                      <p className="text-white font-bold">{m.lawyerId?.name || m.firmId?.name}</p>
                      <p className="text-[#555] text-xs">Legal Consultation</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/chat/${m._id}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-[#d4af37] hover:text-black text-white rounded-lg transition-all font-bold text-sm">
                      Open Secure Chat <MessageSquare size={14} />
                    </Link>
                    <button 
                      onClick={() => handleDeleteChat(m._id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      title="Delete Session"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {meetings.filter(m => m.status === 'accepted').length === 0 && (
                <div className="col-span-full text-center py-10 bg-[#111111] rounded-2xl border border-[#2a2a2a]">
                  <MessageSquare size={32} className="mx-auto text-[#555] mb-2" />
                  <p className="text-[#a0a0a0] text-sm">No active chats available. Request a meeting first.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Meetings & Alerts */}
        <div className="space-y-10">
          <section className="p-8 rounded-2xl bg-[#111111] border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white font-['Playfair_Display']">Meeting Requests</h2>
              <MessageSquare size={18} className="text-[#555]" />
            </div>
            <div className="space-y-4">
              {meetings.map((m) => (
                <div key={m._id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white text-sm font-medium truncate pr-2">{m.firmId?.name}</p>
                    <Badge variant={m.status === 'accepted' ? 'success' : m.status === 'rejected' ? 'danger' : 'neutral'}>
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-[#555] text-xs font-['Inter']">{formatDate(m.preferredDate)}</p>
                </div>
              ))}
              {meetings.length === 0 && (
                <div className="text-center py-6 text-[#555] text-sm italic">
                  No recent requests
                </div>
              )}
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertCircle size={120} className="text-[#d4af37]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-[#d4af37] mb-4">
                <AlertCircle size={20} />
                <h2 className="font-bold font-['Playfair_Display'] uppercase tracking-widest text-xs">Security Note</h2>
              </div>
              <p className="text-white/70 text-sm leading-relaxed font-['Inter']">
                Always verify the firm's identity before sharing sensitive documents. Use the internal <strong>Document Vault</strong> for secure transfers.
              </p>
            </div>
          </section>
        </div>
      </div>

      <MeetingRequestModal 
        isOpen={showMeetingModal} 
        onClose={() => setShowMeetingModal(false)}
        firm={selectedRequest.firm}
        lawyer={selectedRequest.lawyer}
      />
    </div>
  );
}
