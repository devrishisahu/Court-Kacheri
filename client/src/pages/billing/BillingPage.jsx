import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, createInvoice, deleteInvoice, fetchRevenueSummary } from '../../store/slices/billingSlice';
import { fetchCases } from '../../store/slices/caseSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import { usePagination } from '../../hooks/usePagination';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import RevenueChart from '../../components/charts/RevenueChart';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function BillingPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const { items: invoices, summary, loading } = useSelector((state) => state.billing);
  const { items: cases } = useSelector((state) => state.cases);
  const { items: clients } = useSelector((state) => state.clients);
  const [statusFilter, setStatusFilter] = useState('');
  const { page, limit, meta, updateMeta, goToPage } = usePagination();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState({ caseId: '', clientId: '', rate: '', dueDate: '', notes: '', items: [{ description: '', hours: '', rate: '', amount: '' }] });

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const params = { page, limit, sort: '-createdAt' };
      if (statusFilter) params.status = statusFilter;
      const result = await dispatch(fetchInvoices(params)).unwrap();
      updateMeta(result.meta);
    } catch {
      toast.error('Failed to load invoices');
    }
  }, [page, limit, statusFilter, dispatch]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  useEffect(() => {
    dispatch(fetchCases({ limit: 100 }));
    dispatch(fetchClients({ limit: 100 }));
    if (isAdmin) dispatch(fetchRevenueSummary());
  }, [dispatch, isAdmin]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', hours: '', rate: '', amount: '' }] }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => {
    setForm(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: val };
      if (field === 'hours' || field === 'rate') {
        items[idx].amount = ((Number(items[idx].hours) || 0) * (Number(items[idx].rate) || 0)).toFixed(2);
      }
      return { ...p, items };
    });
  };

  const totalAmount = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const handleCreate = async () => {
    if (!form.caseId || !form.clientId) return toast.error('Case and Client required');
    setCreating(true);
    try {
      const body = { caseId: form.caseId, clientId: form.clientId, dueDate: form.dueDate || undefined, notes: form.notes || undefined };
      if (mode === 'auto') {
        body.rate = Number(form.rate);
      } else {
        body.items = form.items.map(i => ({
          description: i.description,
          hours: Number(i.hours),
          rate: Number(i.rate),
          amount: Number(i.amount),
        }));
      }
      await dispatch(createInvoice(body)).unwrap();
      toast.success('Invoice created');
      setShowCreate(false);
      setForm({ caseId: '', clientId: '', rate: '', dueDate: '', notes: '', items: [{ description: '', hours: '', rate: '', amount: '' }] });
      loadInvoices();
      if (isAdmin) dispatch(fetchRevenueSummary());
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteInvoice(deleteId)).unwrap();
      toast.success('Deleted');
      setDeleteId(null);
      loadInvoices();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (s) => {
    const m = { draft: 'neutral', sent: 'info', paid: 'success', overdue: 'danger' };
    return <Badge variant={m[s] || 'neutral'}>{s}</Badge>;
  };

  const columns = [
    { key: 'inv', label: 'Invoice No.', render: (r) => <span className="font-['JetBrains_Mono'] text-white">{r.invoiceNumber}</span> },
    { key: 'case', label: 'Case', render: (r) => <Link to={`/cases/${r.caseId?._id}`} className="text-[#a0a0a0] hover:text-white">{r.caseId?.title || '—'}</Link> },
    { key: 'client', label: 'Client', render: (r) => r.clientId?.name || '—' },
    { key: 'items', label: 'Items', render: (r) => r.items?.length || 0 },
    { key: 'total', label: 'Total', render: (r) => <span className="text-white font-bold">{formatCurrency(r.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'due', label: 'Due', render: (r) => r.dueDate ? <span className={r.status !== 'paid' && new Date(r.dueDate) < new Date() ? 'text-[#f87171]' : ''}>{formatDate(r.dueDate)}</span> : '—' },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-2">
        <Link to={`/billing/${r._id}`} className="text-[#a0a0a0] hover:text-white text-xs">View</Link>
        {isAdmin && <button onClick={() => setDeleteId(r._id)} className="text-[#555555] hover:text-[#f87171] text-xs transition-colors">Delete</button>}
      </div>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">Billing & Invoices</h1>
        {isAdmin && <Button onClick={() => setShowCreate(true)}><Plus size={18} /> Create Invoice</Button>}
      </div>

      {!isAdmin && (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-white font-medium font-['Playfair_Display']">View Only Access</p>
            <p className="text-[#555555] text-sm font-['Inter'] mt-0.5">As a {user?.role}, you can view invoices but cannot create or manage them.</p>
          </div>
        </div>
      )}

      {/* Summary (admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Invoiced', value: formatCurrency(summary.grandTotal) },
            { label: 'Paid', value: formatCurrency(summary.byStatus?.paid?.total || 0) },
            { label: 'Sent', value: formatCurrency(summary.byStatus?.sent?.total || 0) },
            { label: 'Overdue', value: formatCurrency(summary.byStatus?.overdue?.total || 0) },
          ].map(s => (
            <Card key={s.label} hover={false}>
              <p className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter'] mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white font-['Playfair_Display']">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && summary && (
        <Card hover={false} className="mb-6">
          <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-4">Revenue Chart</h3>
          <RevenueChart data={summary.byStatus || {}} />
        </Card>
      )}

      <div className="flex gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); goToPage(1); }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-[#a0a0a0] text-sm font-['Inter'] focus:outline-none">
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
        </select>
      </div>

      <Table columns={columns} data={invoices} loading={loading} emptyMessage="No invoices" emptyIcon={Receipt} />
      <Pagination meta={meta} onPageChange={goToPage} />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice" maxWidth="max-w-2xl"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} loading={creating}>Create Invoice</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Case <span className="text-[#f87171]">*</span></label>
              <select value={form.caseId} onChange={(e) => setForm(p => ({ ...p, caseId: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none">
                <option value="">Select...</option>
                {cases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Client <span className="text-[#f87171]">*</span></label>
              <select value={form.clientId} onChange={(e) => setForm(p => ({ ...p, clientId: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none">
                <option value="">Select...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-lg text-sm font-['Inter'] ${mode === 'manual' ? 'bg-white text-black' : 'bg-[#1a1a1a] text-[#a0a0a0]'}`}>Manual</button>
            <button onClick={() => setMode('auto')} className={`px-4 py-2 rounded-lg text-sm font-['Inter'] ${mode === 'auto' ? 'bg-white text-black' : 'bg-[#1a1a1a] text-[#a0a0a0]'}`}>Auto from Time Entries</button>
          </div>

          {mode === 'auto' ? (
            <div>
              <Input label="Hourly Rate (₹)" type="number" value={form.rate} onChange={(e) => setForm(p => ({ ...p, rate: e.target.value }))} placeholder="500" />
              <p className="text-[#555555] text-xs font-['Inter'] mt-2">Items will be auto-generated from unbilled billable time entries</p>
            </div>
          ) : (
            <div>
              <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter'] block mb-2">Line Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                  <input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description"
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm font-['Inter'] focus:outline-none col-span-4 md:col-span-1" />
                  <input value={item.hours} onChange={(e) => updateItem(idx, 'hours', e.target.value)} placeholder="Hours" type="number"
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm font-['Inter'] focus:outline-none" />
                  <input value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} placeholder="Rate ₹" type="number"
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm font-['Inter'] focus:outline-none" />
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-['JetBrains_Mono']">{formatCurrency(item.amount || 0)}</span>
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-[#555555] hover:text-[#f87171] text-xs">×</button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="text-white text-xs font-['Inter'] underline mt-1">+ Add item</button>
            </div>
          )}

          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} maxLength={2000} rows={2} placeholder="Payment terms..."
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-[#555555] text-sm font-['Inter'] focus:outline-none resize-none" />
            <span className="text-[#555555] text-xs text-right font-['Inter']">{form.notes.length}/2000</span>
          </div>

          {mode === 'manual' && (
            <div className="text-right pt-4 border-t border-[#2a2a2a]">
              <p className="text-[#a0a0a0] text-xs font-['Inter'] uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-white font-['Playfair_Display']">{formatCurrency(totalAmount)}</p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </motion.div>
  );
}
