import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCases, deleteCase, getMyCases } from '../../store/slices/caseSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import api from '../../api/axios';
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

export default function CasesPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: cases, loading } = useSelector((state) => state.cases);
  const { items: clients } = useSelector((state) => state.clients);
  const [activeTab, setActiveTab] = useState('All Firm Cases');
  const [firmLawyers, setFirmLawyers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('-createdAt');
  const { page, limit, meta, updateMeta, goToPage } = usePagination();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', clientId: '', description: '', status: 'open', assignedLawyers: [] });

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const params = { page, limit, sort: sortOrder };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const fetchAction = activeTab === 'My Cases' ? getMyCases : fetchCases;
      const result = await dispatch(fetchAction(params)).unwrap();
      updateMeta(result.meta);
    } catch {
      toast.error('Failed to load cases');
    }
  }, [page, limit, search, statusFilter, sortOrder, activeTab, dispatch]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    if (user?.role === 'admin') {
      api.get('/firms/lawyers').then(res => setFirmLawyers(res.data.data)).catch(console.error);
    }
  }, [dispatch, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => goToPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    if (!form.title || !form.clientId) return toast.error('Title and Client are required');
    setCreating(true);
    try {
      await api.post('/cases', form);
      toast.success('Case created');
      setShowCreate(false);
      setForm({ title: '', clientId: '', description: '', status: 'open', assignedLawyers: [] });
      loadCases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteCase(deleteId)).unwrap();
      toast.success('Case deleted');
      setDeleteId(null);
      loadCases();
    } catch (err) {
      toast.error(err || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'caseNumber',
      label: 'Case No.',
      render: (row) => (
        <span className="font-['JetBrains_Mono'] text-[#a0a0a0] text-xs">{row.caseNumber}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <Link to={`/cases/${row._id}`} className="text-white hover:underline font-medium">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (row) => row.clientId?.name || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'open' ? 'white' : 'neutral'}>{row.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => user?.role === 'admin' ? (
        <button
          onClick={() => setDeleteId(row._id)}
          className="text-[#555555] hover:text-[#f87171] transition-colors text-xs font-['Inter']"
        >
          Delete
        </button>
      ) : null,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">Cases</h1>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New Case
          </Button>
        )}
      </div>

      {/* Tabs */}
      {user?.role !== 'client' && (
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-[#2a2a2a]">
          {['All Firm Cases', 'My Cases'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); goToPage(1); }}
              className={`px-5 py-3 text-sm font-['Inter'] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px hover:text-[#a0a0a0] ${
                activeTab === tab ? 'text-white border-white' : 'text-[#555555] border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#555555] text-sm font-['Inter'] focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none"
        >
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="title">A—Z</option>
        </select>
      </div>

      <Table columns={columns} data={cases} loading={loading} emptyMessage="No cases found" emptyIcon={Scale} />
      <Pagination meta={meta} onPageChange={goToPage} />

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Case"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create Case</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title" required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Land Dispute — Plot 45B"
          />
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">
              Client <span className="text-[#f87171]">*</span>
            </label>
            <select
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none focus:border-white/40"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          {user?.role === 'admin' && (
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Assigned Lawyers</label>
            <div className="space-y-2 max-h-32 overflow-y-auto mt-1 custom-scrollbar">
              {firmLawyers.map(l => (
                <label key={l._id} className="flex items-center gap-2 text-sm text-white cursor-pointer bg-[#1a1a1a] p-2 rounded-lg border border-[#2a2a2a] hover:border-[#444]">
                  <input type="checkbox" checked={form.assignedLawyers.includes(l._id)} onChange={(e) => {
                    setForm(p => ({
                      ...p,
                      assignedLawyers: e.target.checked 
                        ? [...p.assignedLawyers, l._id]
                        : p.assignedLawyers.filter(id => id !== l._id)
                    }))
                  }} className="accent-white" />
                  {l.name} <span className="text-[#555] text-xs ml-auto">{l.email}</span>
                </label>
              ))}
              {firmLawyers.length === 0 && <div className="text-[#555] text-sm">No lawyers in firm to assign.</div>}
            </div>
          </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={5000}
              rows={3}
              placeholder="Case details..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-[#555555] text-sm font-['Inter'] focus:outline-none focus:border-white/40 resize-none"
            />
            <span className="text-[#555555] text-xs font-['Inter'] text-right">
              {form.description.length}/5000
            </span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="This will permanently delete this case and cannot be undone."
      />
    </motion.div>
  );
}
