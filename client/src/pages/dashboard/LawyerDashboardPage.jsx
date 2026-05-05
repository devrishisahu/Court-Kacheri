import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Calendar, Clock, Square, MessageSquare, Users, Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { getMyCases } from '../../store/slices/caseSlice';
import { fetchDeadlines } from '../../store/slices/deadlineSlice';
import { fetchTimeEntries, stopTimer, getMySummary } from '../../store/slices/timeEntrySlice';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

export default function LawyerDashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: caseItems, meta: caseMeta } = useSelector((state) => state.cases);
  const { items: deadlineItems, meta: deadlineMeta } = useSelector((state) => state.deadlines);
  const { activeTimer, mySummary } = useSelector((state) => state.timeEntries);

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [invites, setInvites] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.firmId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
    fetchInvites();
  }, [user?.firmId]);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/firms/invites/me');
      setInvites(res.data.data);
    } catch {
      // Ignore
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings/lawyer');
      setMeetings(res.data.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'meetings' || activeTab === 'chats') {
      fetchMeetings();
    }
  }, [activeTab]);

  const handleRespondInvite = async (id, status) => {
    try {
      await api.put(`/firms/invites/${id}/respond`, { status });
      toast.success(status === 'accepted' ? 'Welcome to the firm!' : 'Invite rejected');
      setInvites(p => p.filter(i => i._id !== id));
      if (status === 'accepted') {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleRespondMeeting = async (id, status) => {
    try {
      await api.patch(`/meetings/lawyer/${id}/status`, { status });
      toast.success(`Meeting ${status}`);
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to respond to meeting');
    }
  };

  const handleDeleteChat = async (id) => {
    if (!window.confirm('Delete this entire chat session and sever the connection?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Chat session deleted');
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  // Live timer tick
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(getMyCases({ limit: 5, sort: '-createdAt' })).unwrap(),
        dispatch(fetchDeadlines({ status: 'upcoming', limit: 5, sort: 'dueDate' })).unwrap(),
        dispatch(getMySummary()).unwrap(),
      ]);

      // Fetch time entries (also detects active timer)
      dispatch(fetchTimeEntries({ limit: 1, sort: '-createdAt' }));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await dispatch(stopTimer({ id: activeTimer._id })).unwrap();
      toast.success('Timer stopped');
      setElapsed(0);
      dispatch(getMySummary());
    } catch (err) {
      toast.error(err || 'Failed to stop timer');
    }
  };

  const formatElapsed = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const statusBadge = (status) => {
    const map = { open: 'white', closed: 'neutral', upcoming: 'info', overdue: 'danger', completed: 'success' };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const statCards = [
    { label: 'My Active Cases', value: caseMeta?.total || 0, icon: Scale },
    { label: 'My Upcoming Deadlines', value: deadlineMeta?.total || 0, icon: Calendar },
    { label: 'My Billable Hours', value: mySummary?.billableHours || 0, icon: Clock },
    { label: 'My Total Time Entries', value: mySummary?.totalEntries || 0, icon: Clock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {invites.length > 0 && (
        <div className="mb-8 space-y-3">
          {invites.map(inv => (
            <div key={inv._id} className="bg-[#1a1a1a] border border-white/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Firm Invitation</p>
                <p className="text-[#a0a0a0] text-sm">You have been invited to join <strong className="text-white">{inv.firmId?.name}</strong> by {inv.invitedBy?.name}.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleRespondInvite(inv._id, 'rejected')}>Decline</Button>
                <Button size="sm" onClick={() => handleRespondInvite(inv._id, 'accepted')}>Join Firm</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">
          My Dashboard
        </h1>
        <div className="flex gap-4 border-b border-white/5 pb-2 w-full md:w-auto">
          {['overview', 'meetings', 'chats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all capitalize relative ${
                activeTab === tab ? 'text-[#d4af37] border-[#d4af37]' : 'text-[#555] border-transparent hover:text-white'
              }`}
            >
              {tab}
              {tab === 'chats' && meetings.some(m => m.unreadCount > 0) && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {tab === 'meetings' && meetings.some(m => m.status === 'pending') && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter'] mb-2">
                  {label}
                </p>
                <p className="text-3xl lg:text-4xl font-bold text-white font-['Playfair_Display']">
                  {loading ? (
                    <span className="inline-block w-20 h-8 bg-[#1a1a1a] rounded animate-pulse" />
                  ) : (
                    value
                  )}
                </p>
              </div>
              <Icon size={24} className="text-white/40" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Recent Cases */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider">
              My Recent Cases
            </h3>
            <Link to="/cases" className="text-[#a0a0a0] text-xs hover:text-white transition-colors font-['Inter']">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />
                ))
              : caseItems && caseItems.length > 0 ? caseItems.map((c) => (
                  <Link
                    key={c._id}
                    to={`/cases/${c._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-['Inter']">{c.title}</p>
                      <p className="text-[#555555] text-xs font-['JetBrains_Mono']">{c.caseNumber}</p>
                    </div>
                    {statusBadge(c.status)}
                  </Link>
                )) : <p className="text-[#555555] text-sm text-center py-4">No cases assigned</p>}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider">
              Upcoming Deadlines
            </h3>
            <Link to="/deadlines" className="text-[#a0a0a0] text-xs hover:text-white transition-colors font-['Inter']">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />
                ))
              : deadlineItems && deadlineItems.length > 0 ? deadlineItems.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-['Inter']">{d.title}</p>
                      <p className="text-[#555555] text-xs font-['Inter']">{formatDate(d.dueDate)}</p>
                    </div>
                    <Badge variant="info">{d.type}</Badge>
                  </div>
                )) : <p className="text-[#555555] text-sm text-center py-4">No upcoming deadlines</p>}
          </div>
        </Card>
      </div>

      {/* Running Timer */}
      {activeTimer && (
        <Card hover={false} className="border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-white font-['JetBrains_Mono'] text-3xl">{formatElapsed(elapsed)}</p>
                <p className="text-[#a0a0a0] text-sm font-['Inter'] mt-1">
                  {activeTimer.description || 'Active timer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopTimer}
              className="flex items-center gap-2 bg-[#f87171] text-black px-5 py-2.5 rounded-lg font-semibold font-['Inter'] hover:bg-red-400 transition-colors"
            >
              <Square size={16} />
              Stop
            </button>
          </div>
        </Card>
      )}
        </>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {meetings.filter(m => m.status === 'pending').map(m => (
            <Card key={m._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold text-lg">{m.clientId?.name}</h3>
                <p className="text-[#a0a0a0] text-sm">{m.clientId?.email}</p>
                <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 text-[#d4af37] text-sm italic">
                  "{m.message}"
                </div>
                <p className="text-[#555] text-xs mt-2 flex items-center gap-2">
                  <Calendar size={12} /> {formatDate(m.preferredDate)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleRespondMeeting(m._id, 'rejected')}>
                  <X size={16} /> Reject
                </Button>
                <Button onClick={() => handleRespondMeeting(m._id, 'accepted')}>
                  <Check size={16} /> Accept
                </Button>
              </div>
            </Card>
          ))}
          {meetings.filter(m => m.status === 'pending').length === 0 && (
            <div className="text-center py-20 bg-[#111111] rounded-2xl border border-[#2a2a2a]">
              <MessageSquare size={48} className="mx-auto text-[#2a2a2a] mb-4" />
              <p className="text-[#a0a0a0]">No pending meeting requests</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.filter(m => m.status === 'accepted').map(m => (
            <Card key={m._id} className="group hover:border-[#d4af37]/30 transition-all cursor-pointer relative">
              {m.unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-bounce">
                  {m.unreadCount} NEW
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981] font-bold">
                  {m.clientId?.name?.[0]}
                </div>
                <div>
                  <p className="text-white font-bold">{m.clientId?.name}</p>
                  <p className="text-[#555] text-xs">Client Case Chat</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/chat/${m._id}`} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-[#d4af37] hover:text-black text-white rounded-lg transition-all font-bold text-sm">
                  Open Chat <MessageSquare size={14} />
                </Link>
                <button 
                  onClick={(e) => { e.preventDefault(); handleDeleteChat(m._id); }}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  title="Delete Session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
          {meetings.filter(m => m.status === 'accepted').length === 0 && (
            <div className="text-center py-10 col-span-full">
              <p className="text-[#555]">No active chats found. Accept a meeting request first.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
