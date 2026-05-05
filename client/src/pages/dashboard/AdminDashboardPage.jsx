import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Users, Calendar, Receipt, Clock, Square, MessageSquare, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCases } from '../../store/slices/caseSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import { fetchDeadlines } from '../../store/slices/deadlineSlice';
import { fetchTimeEntries, stopTimer } from '../../store/slices/timeEntrySlice';
import { fetchRevenueSummary } from '../../store/slices/billingSlice';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import RevenueChart from '../../components/charts/RevenueChart';
import CaseStatusChart from '../../components/charts/CaseStatusChart';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: caseItems, meta: caseMeta } = useSelector((state) => state.cases);
  const { meta: clientMeta } = useSelector((state) => state.clients);
  const { items: deadlineItems, meta: deadlineMeta } = useSelector((state) => state.deadlines);
  const { activeTimer } = useSelector((state) => state.timeEntries);
  const { summary: revenueSummary } = useSelector((state) => state.billing);

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [caseStats, setCaseStats] = useState({ open: 0, closed: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [meetingRequests, setMeetingRequests] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live timer tick
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchDashboardData = async () => {
    if (!user?.firmId && user?.role !== 'super_admin') {
      return;
    }
    try {
      const [casesRes, clientsRes, deadlinesRes] = await Promise.all([
        dispatch(fetchCases({ limit: 5, sort: '-createdAt' })).unwrap(),
        dispatch(fetchClients({ limit: 1 })).unwrap(),
        dispatch(fetchDeadlines({ status: 'upcoming', limit: 5, sort: 'dueDate' })).unwrap(),
      ]);

      setRecentCases(casesRes.items);
      setUpcomingDeadlines(deadlinesRes.items);

      // Fetch time entries (also detects active timer)
      dispatch(fetchTimeEntries({ limit: 1, sort: '-createdAt' }));

      // Case status counts
      const [openRes, closedRes] = await Promise.all([
        api.get('/cases?status=open&limit=1'),
        api.get('/cases?status=closed&limit=1'),
      ]);
      setCaseStats({
        open: openRes.data.meta?.total || 0,
        closed: closedRes.data.meta?.total || 0,
      });

      // Revenue summary (admin only)
      if (user?.role === 'admin') {
        dispatch(fetchRevenueSummary());
        const meetingsRes = await api.get('/meetings/firm');
        setMeetingRequests(meetingsRes.data.data.filter(m => m.status === 'pending'));
      }
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
    } catch (err) {
      toast.error(err || 'Failed to stop timer');
    }
  };

  const handleMeetingAction = async (id, status) => {
    try {
      await api.patch(`/meetings/${id}/status`, { status });
      toast.success(`Request ${status}`);
      setMeetingRequests(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      toast.error('Failed to update meeting status');
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
    { label: 'Total Cases', value: caseMeta?.total || 0, icon: Scale },
    { label: 'Total Clients', value: clientMeta?.total || 0, icon: Users },
    { label: 'Upcoming Deadlines', value: deadlineMeta?.total || 0, icon: Calendar },
    { label: 'Total Revenue', value: formatCurrency(revenueSummary?.grandTotal || 0), icon: Receipt },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-8">
        Dashboard
      </h1>

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card hover={false}>
          <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-4">
            Revenue by Status
          </h3>
          <RevenueChart data={revenueSummary?.byStatus || {}} />
        </Card>
        <Card hover={false}>
          <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-4">
            Case Distribution
          </h3>
          <CaseStatusChart open={caseStats.open} closed={caseStats.closed} />
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Recent Cases */}
        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider">
              Recent Cases
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
              : recentCases.map((c) => (
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
                ))}
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
              : upcomingDeadlines.map((d) => (
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
                ))}
          </div>
        </Card>
      </div>

      {/* Meeting Requests Section (Admin Only) */}
      {user?.role === 'admin' && meetingRequests.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare size={20} className="text-[#d4af37]" />
            <h2 className="text-xl font-bold text-white font-['Playfair_Display']">Incoming Meeting Requests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetingRequests.map((req) => (
              <div key={req._id} className="p-6 rounded-2xl bg-[#111111] border border-[#d4af37]/20 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white font-bold">{req.clientId?.name}</p>
                    <p className="text-[#555] text-xs">{req.clientId?.email}</p>
                  </div>
                  <Badge variant="info">New</Badge>
                </div>
                <p className="text-[#a0a0a0] text-sm font-['Inter'] line-clamp-2 mb-4 italic">"{req.message}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <p className="text-[#555] text-xs uppercase tracking-widest font-bold">
                    {new Date(req.preferredDate).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleMeetingAction(req._id, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                      <X size={16} />
                    </button>
                    <button onClick={() => handleMeetingAction(req._id, 'accepted')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
    </motion.div>
  );
}
