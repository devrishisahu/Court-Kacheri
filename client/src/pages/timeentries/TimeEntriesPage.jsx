import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTimeEntries, startTimer, stopTimer, deleteTimeEntry } from '../../store/slices/timeEntrySlice';
import { fetchCases } from '../../store/slices/caseSlice';
import { usePagination } from '../../hooks/usePagination';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDuration = (min) => {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function TimeEntriesPage() {
  const dispatch = useDispatch();
  const { items: entries, activeTimer, loading } = useSelector((state) => state.timeEntries);
  const { items: cases } = useSelector((state) => state.cases);
  const [elapsed, setElapsed] = useState(0);
  const { page, limit, meta, updateMeta, goToPage } = usePagination();

  // Filters
  const [caseFilter, setCaseFilter] = useState('');
  const [billableFilter, setBillableFilter] = useState('');

  // New timer form
  const [newCaseId, setNewCaseId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [starting, setStarting] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const params = { page, limit, sort: '-createdAt' };
      if (caseFilter) params.caseId = caseFilter;
      if (billableFilter) params.billable = billableFilter;
      const result = await dispatch(fetchTimeEntries(params)).unwrap();
      updateMeta(result.meta);
    } catch {
      toast.error('Failed to load entries');
    }
  }, [page, limit, caseFilter, billableFilter, dispatch]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { dispatch(fetchCases({ limit: 100 })); }, [dispatch]);

  // Live ticker
  useEffect(() => {
    if (!activeTimer) return;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [activeTimer]);

  const formatElapsed = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handleStartTimer = async () => {
    if (!newCaseId) return toast.error('Select a case');
    setStarting(true);
    try {
      await dispatch(startTimer({ caseId: newCaseId, description: newDesc })).unwrap();
      toast.success('Timer started');
      setNewCaseId('');
      setNewDesc('');
      loadEntries();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setStarting(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await dispatch(stopTimer({ id: activeTimer._id })).unwrap();
      toast.success('Timer stopped');
      setElapsed(0);
      loadEntries();
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteTimeEntry(deleteId)).unwrap();
      toast.success('Entry deleted');
      setDeleteId(null);
      loadEntries();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'case', label: 'Case', render: (r) => <span className="text-white">{r.caseId?.title || '—'}</span> },
    { key: 'user', label: 'Started By', render: (r) => r.userId?.name || '—' },
    { key: 'start', label: 'Start', render: (r) => formatDate(r.startTime) },
    { key: 'duration', label: 'Duration', render: (r) => <span className="font-['JetBrains_Mono']">{r.endTime ? formatDuration(r.duration) : '⏱ Running'}</span> },
    { key: 'desc', label: 'Description', render: (r) => <span className="truncate max-w-[200px] block">{r.description || '—'}</span> },
    { key: 'billable', label: 'Billable', render: (r) => <Badge variant={r.billable ? 'white' : 'neutral'}>{r.billable ? 'Yes' : 'No'}</Badge> },
    { key: 'billed', label: 'Billed', render: (r) => r.billed ? <Badge variant="success">Billed</Badge> : null },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => setDeleteId(r._id)} className="text-[#555555] hover:text-[#f87171] transition-colors"><Trash2 size={14} /></button>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-8">Time Entries</h1>

      {/* Active Timer / Start Timer */}
      <Card hover={false} className="mb-8 border-white/10">
        {activeTimer ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-white font-['JetBrains_Mono'] text-3xl md:text-4xl">{formatElapsed(elapsed)}</p>
                <p className="text-[#a0a0a0] text-sm font-['Inter'] mt-1">
                  {activeTimer.caseId?.title || 'Case'} • {activeTimer.description || 'No description'}
                </p>
              </div>
            </div>
            <button onClick={handleStopTimer} className="flex items-center gap-2 bg-[#f87171] text-black px-6 py-3 rounded-lg font-semibold font-['Inter'] hover:bg-red-400 transition-colors">
              <Square size={16} /> Stop Timer
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[#a0a0a0] text-sm font-['Inter'] mb-4">No active timer</p>
            <div className="flex flex-col md:flex-row gap-3">
              <select value={newCaseId} onChange={(e) => setNewCaseId(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none flex-1">
                <option value="">Select case...</option>
                {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What are you working on?"
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-[#555555] text-sm font-['Inter'] focus:outline-none flex-1" />
              <Button onClick={handleStartTimer} loading={starting}><Play size={16} /> Start</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={caseFilter} onChange={(e) => { setCaseFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none">
          <option value="">All Cases</option>
          {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
        <select value={billableFilter} onChange={(e) => { setBillableFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none">
          <option value="">All Types</option>
          <option value="true">Billable</option><option value="false">Non-billable</option>
        </select>
      </div>

      <Table columns={columns} data={entries} loading={loading} emptyMessage="No time entries" emptyIcon={Clock} />
      <Pagination meta={meta} onPageChange={goToPage} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </motion.div>
  );
}
