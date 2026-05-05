import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeadlines, createDeadline, deleteDeadline } from '../../store/slices/deadlineSlice';
import { fetchCases } from '../../store/slices/caseSlice';
import { usePagination } from '../../hooks/usePagination';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const timeAgo = (date) => {
  const now = Date.now();
  const diff = new Date(date).getTime() - now;
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (diff > 0) {
    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return `in ${mins}m`;
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

export default function DeadlinesPage() {
  const dispatch = useDispatch();
  const { items: deadlines, loading } = useSelector((state) => state.deadlines);
  const { items: cases } = useSelector((state) => state.cases);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { page, limit, meta, updateMeta, goToPage } = usePagination();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ caseId: '', title: '', description: '', dueDate: '', type: 'hearing' });

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDeadlines = useCallback(async () => {
    try {
      const params = { page, limit, sort: 'dueDate' };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const result = await dispatch(fetchDeadlines(params)).unwrap();
      updateMeta(result.meta);
    } catch {
      toast.error('Failed to load deadlines');
    }
  }, [page, limit, statusFilter, typeFilter, dateFrom, dateTo, dispatch]);

  useEffect(() => { loadDeadlines(); }, [loadDeadlines]);
  useEffect(() => { dispatch(fetchCases({ limit: 100 })); }, [dispatch]);

  const handleCreate = async () => {
    if (!form.caseId || !form.title || !form.dueDate) return toast.error('Fill all required fields');
    setCreating(true);
    try {
      const result = await dispatch(createDeadline(form)).unwrap();
      if (result?.conflicts?.length) {
        toast(`⚠️ ${result.conflicts.length} conflict(s)`, { icon: '⚠️' });
      } else {
        toast.success('Deadline created');
      }
      setShowCreate(false);
      setForm({ caseId: '', title: '', description: '', dueDate: '', type: 'hearing' });
      loadDeadlines();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteDeadline(deleteId)).unwrap();
      toast.success('Deadline deleted');
      setDeleteId(null);
      loadDeadlines();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const typeBadge = (type) => {
    const map = { hearing: 'info', filing: 'white', meeting: 'warning', other: 'neutral' };
    return <Badge variant={map[type] || 'neutral'}>{type}</Badge>;
  };
  const statusBadge = (status) => {
    const map = { upcoming: 'info', overdue: 'danger', completed: 'success' };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <span className="text-white font-medium">{r.title}</span> },
    { key: 'case', label: 'Case', render: (r) => <span className="text-[#a0a0a0]">{r.caseId?.title || '—'}</span> },
    { key: 'dueDate', label: 'Due Date', render: (r) => <span className={r.status === 'overdue' ? 'text-[#f87171]' : ''}>{formatDate(r.dueDate)}</span> },
    { key: 'type', label: 'Type', render: (r) => typeBadge(r.type) },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'countdown', label: 'Countdown', render: (r) => <span className="font-['JetBrains_Mono'] text-xs">{timeAgo(r.dueDate)}</span> },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => setDeleteId(r._id)} className="text-[#555555] hover:text-[#f87171] text-xs transition-colors">Delete</button>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">Deadlines</h1>
        <Button onClick={() => setShowCreate(true)}><Plus size={18} /> Add Deadline</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none">
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="overdue">Overdue</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none">
          <option value="">All Types</option>
          <option value="hearing">Hearing</option><option value="filing">Filing</option><option value="meeting">Meeting</option><option value="other">Other</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From"
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To"
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none" />
      </div>

      <Table columns={columns} data={deadlines} loading={loading} emptyMessage="No deadlines" emptyIcon={Calendar} />
      <Pagination meta={meta} onPageChange={goToPage} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Deadline"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} loading={creating}>Create</Button></>}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Case <span className="text-[#f87171]">*</span></label>
            <select value={form.caseId} onChange={(e) => setForm(p => ({ ...p, caseId: e.target.value }))}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none">
              <option value="">Select case...</option>
              {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <Input label="Title" required value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Next Hearing" />
          <Input label="Due Date" type="datetime-local" required value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Type</label>
            <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none">
              <option value="hearing">Hearing</option><option value="filing">Filing</option><option value="meeting">Meeting</option><option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </motion.div>
  );
}
