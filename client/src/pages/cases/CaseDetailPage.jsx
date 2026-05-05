import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Play, Square, Trash2, Plus, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCase, updateCase } from '../../store/slices/caseSlice';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../store/slices/documentSlice';
import { fetchDeadlines, createDeadline } from '../../store/slices/deadlineSlice';
import { fetchTimeEntries, startTimer } from '../../store/slices/timeEntrySlice';
import { fetchInvoices } from '../../store/slices/billingSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AnalysisTriggerButton from '../../components/ai/AnalysisTriggerButton';
import api from '../../api/axios';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const tabs = ['Overview', 'Documents', 'Deadlines', 'Time Entries', 'Billing'];
const clientTabs = ['Overview', 'Documents', 'Deadlines', 'Billing'];

export default function CaseDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { current: caseData, loading } = useSelector((state) => state.cases);
  const { items: documents, uploading } = useSelector((state) => state.documents);
  const { items: deadlines } = useSelector((state) => state.deadlines);
  const { items: timeEntries } = useSelector((state) => state.timeEntries);
  const { items: invoices } = useSelector((state) => state.billing);

  const [activeTab, setActiveTab] = useState('Overview');

  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({ title: '', dueDate: '', type: 'hearing', description: '' });
  const [creatingDeadline, setCreatingDeadline] = useState(false);

  // Delete & AI States
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedDocId, setExpandedDocId] = useState(null);

  // Admin Case Controls
  const [showLawyersModal, setShowLawyersModal] = useState(false);
  const [firmLawyers, setFirmLawyers] = useState([]);
  const [selectedLawyers, setSelectedLawyers] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' && showLawyersModal && firmLawyers.length === 0) {
      api.get('/firms/lawyers').then(res => setFirmLawyers(res.data.data)).catch(console.error);
    }
  }, [user, showLawyersModal, firmLawyers.length]);

  const toggleStatus = async () => {
    const newStatus = caseData.status === 'open' ? 'closed' : 'open';
    try {
      await dispatch(updateCase({ id, body: { status: newStatus } })).unwrap();
      toast.success(`Case marked as ${newStatus}`);
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleUpdateLawyers = async () => {
    setUpdating(true);
    try {
      await dispatch(updateCase({ id, body: { assignedLawyers: selectedLawyers } })).unwrap();
      toast.success('Assigned lawyers updated');
      setShowLawyersModal(false);
    } catch (err) {
      toast.error(err || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    dispatch(fetchCase(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (activeTab === 'Documents') dispatch(fetchDocuments(id));
    if (activeTab === 'Deadlines') dispatch(fetchDeadlines({ caseId: id }));
    if (activeTab === 'Time Entries') dispatch(fetchTimeEntries({ caseId: id }));
    if (activeTab === 'Billing') dispatch(fetchInvoices({ caseId: id }));
  }, [activeTab, id, dispatch]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return toast.error('Only PDF & DOCX allowed');
    if (file.size > 10 * 1024 * 1024) return toast.error('File exceeds 10MB limit');

    try {
      await dispatch(uploadDocument({ file, caseId: id })).unwrap();
      toast.success('Document uploaded');
      dispatch(fetchDocuments(id));
    } catch (err) {
      toast.error(err || 'Upload failed');
    }
  };

  const handleCreateDeadline = async () => {
    if (!deadlineForm.title || !deadlineForm.dueDate) return toast.error('Title and due date required');
    setCreatingDeadline(true);
    try {
      const result = await dispatch(createDeadline({ ...deadlineForm, caseId: id })).unwrap();
      if (result?.conflicts?.length) {
        toast(`⚠️ ${result.conflicts.length} conflict(s) detected`, { icon: '⚠️' });
      } else {
        toast.success('Deadline created');
      }
      setShowDeadline(false);
      setDeadlineForm({ title: '', dueDate: '', type: 'hearing', description: '' });
      dispatch(fetchDeadlines({ caseId: id }));
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setCreatingDeadline(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      await dispatch(startTimer({ caseId: id })).unwrap();
      toast.success('Timer started');
      dispatch(fetchTimeEntries({ caseId: id }));
    } catch (err) {
      toast.error(err || 'Failed to start');
    }
  };

  const formatDuration = (min) => {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111111] rounded-2xl animate-pulse" />)}</div>;
  }

  if (!caseData) return <p className="text-[#a0a0a0] font-['Inter']">Case not found</p>;

  const statusVariant = caseData.status === 'open' ? 'white' : 'neutral';
  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/cases" className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm font-['Inter'] mb-6">
        <ArrowLeft size={16} /> Back to Cases
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <p className="font-['JetBrains_Mono'] text-[#555555] text-sm mb-1">{caseData.caseNumber}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-['Playfair_Display']">{caseData.title}</h1>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 self-start">
          <Badge variant={statusVariant}>{caseData.status}</Badge>
          {user?.role === 'admin' && (
            <button
               onClick={toggleStatus}
               className="text-[#a0a0a0] hover:text-white text-xs font-['Inter'] transition-colors underline"
            >
               Mark as {caseData.status === 'open' ? 'Closed' : 'Open'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto border-b border-[#2a2a2a]">
        {(user?.role === 'client' ? clientTabs : tabs).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-['Inter'] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'text-white border-white' : 'text-[#555555] border-transparent hover:text-[#a0a0a0]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover={false}>
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-3">Description</h3>
            <p className="text-[#a0a0a0] text-sm font-['Inter'] leading-relaxed">{caseData.description || 'No description'}</p>
          </Card>
          <Card hover={false}>
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-3">Client</h3>
            <p className="text-white font-['Inter']">{caseData.clientId?.name}</p>
            <p className="text-[#a0a0a0] text-sm font-['Inter']">{caseData.clientId?.email}</p>
          </Card>
          <Card hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider">Assigned Lawyers</h3>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => {
                    setSelectedLawyers(caseData.assignedLawyers?.map(l => l._id) || []);
                    setShowLawyersModal(true);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-['Inter'] transition-colors"
                >
                  Edit Assignments
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(caseData.assignedLawyers || []).map(l => (
                <p key={l._id} className="text-[#a0a0a0] text-sm font-['Inter']">{l.name} — {l.email}</p>
              ))}
              {(!caseData.assignedLawyers || caseData.assignedLawyers.length === 0) && (
                <p className="text-[#555555] text-sm font-['Inter']">No lawyers assigned</p>
              )}
            </div>
          </Card>
          <Card hover={false}>
            <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-3">Info</h3>
            <p className="text-[#a0a0a0] text-sm font-['Inter']">Created: {formatDate(caseData.createdAt)}</p>
          </Card>
        </div>
      )}

      {activeTab === 'Documents' && (
        <div>
          {user?.role !== 'client' && (
            <label className="flex flex-col items-center justify-center bg-[#111111] border-2 border-dashed border-[#2a2a2a] rounded-2xl p-12 mb-6 cursor-pointer hover:border-white/20 transition-colors">
              <Upload size={32} className="text-[#555555] mb-3" />
              <p className="text-[#a0a0a0] text-sm font-['Inter']">{uploading ? 'Uploading...' : 'Drop PDF or DOCX files here'}</p>
              <p className="text-[#555555] text-xs font-['Inter'] mt-1">Max 10MB</p>
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
          <div className="space-y-4">
            {documents.map(doc => (
              <div key={doc._id} className="relative">
                <div className="flex items-center justify-between bg-[#111111] border border-[#2a2a2a] rounded-lg px-5 py-3">
                  <div>
                    <a href={`${apiBaseURL}/documents/file/${doc.fileUrl?.split('/').pop()}`} target="_blank" rel="noreferrer" className="text-white text-sm font-['Inter'] hover:underline">{doc.fileName}</a>
                    <p className="text-[#555555] text-xs font-['Inter']">{(doc.fileSize / 1024).toFixed(1)} KB • {formatDate(doc.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.mimeType === 'application/pdf' && (
                      <Link 
                        to={`/cases/${id}/documents/${doc._id}/intelligence`}
                        className="text-indigo-200 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-md transition-colors border border-indigo-500/30 font-semibold tracking-wide flex items-center gap-1.5"
                      >
                        <BrainCircuit size={14} /> AI Intelligence
                      </Link>
                    )}
                    {user?.role !== 'client' && (user?.role === 'admin' || doc.uploadedBy?._id === user?._id || doc.uploadedBy === user?._id) && (
                      <button onClick={() => setDeleteTarget({ type: 'document', id: doc._id })} className="text-[#555555] hover:text-[#f87171] transition-colors ml-2"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] text-center py-8">No documents yet</p>}
          </div>
        </div>
      )}

      {activeTab === 'Deadlines' && (
        <div>
          {user?.role !== 'client' && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowDeadline(true)} size="sm"><Plus size={16} /> Add Deadline</Button>
            </div>
          )}
          <div className="relative pl-6 border-l border-[#2a2a2a]">
            {deadlines.map(d => (
              <div key={d._id} className="mb-6 relative">
                <div className={`absolute -left-[29px] w-3 h-3 rounded-full ${d.status === 'overdue' ? 'bg-[#f87171]' : d.status === 'completed' ? 'bg-green-400' : 'bg-white'}`} />
                <Card hover={false} className={d.status === 'overdue' ? 'border-l-4 border-l-[#f87171]' : ''}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-['Inter'] font-medium">{d.title}</p>
                      <p className="text-[#555555] text-xs font-['Inter'] mt-1">{formatDate(d.dueDate)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={d.type === 'hearing' ? 'info' : d.type === 'meeting' ? 'warning' : 'neutral'}>{d.type}</Badge>
                      <Badge variant={d.status === 'overdue' ? 'danger' : d.status === 'completed' ? 'success' : 'info'}>{d.status}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
            {deadlines.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] py-8">No deadlines</p>}
          </div>
        </div>
      )}

      {activeTab === 'Time Entries' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={handleStartTimer} size="sm"><Play size={16} /> Start Timer</Button>
          </div>
          <div className="space-y-2">
            {timeEntries.map(te => (
              <div key={te._id} className="flex items-center justify-between bg-[#111111] border border-[#2a2a2a] rounded-lg px-5 py-3">
                <div>
                  <p className="text-white text-sm font-['Inter']">{te.description || 'No description'}</p>
                  <p className="text-[#555555] text-xs font-['Inter']">{te.userId?.name} • {formatDate(te.startTime)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['JetBrains_Mono'] text-white text-sm">{formatDuration(te.duration)}</span>
                  <Badge variant={te.billable ? 'white' : 'neutral'}>{te.billable ? 'Billable' : 'Non-billable'}</Badge>
                  {te.billed && <Badge variant="success">Billed</Badge>}
                </div>
              </div>
            ))}
            {timeEntries.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] text-center py-8">No time entries</p>}
          </div>
        </div>
      )}

      {activeTab === 'Billing' && (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Link key={inv._id} to={`/billing/${inv._id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-['JetBrains_Mono'] text-white text-sm">{inv.invoiceNumber}</p>
                  <p className="text-[#555555] text-xs font-['Inter']">Due: {inv.dueDate ? formatDate(inv.dueDate) : '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold font-['Inter']">{formatCurrency(inv.totalAmount)}</span>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : inv.status === 'sent' ? 'info' : 'neutral'}>{inv.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {invoices.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] text-center py-8">No invoices</p>}
        </div>
      )}

      {/* Deadline Modal */}
      <Modal isOpen={showDeadline} onClose={() => setShowDeadline(false)} title="Add Deadline"
        footer={<><Button variant="secondary" onClick={() => setShowDeadline(false)}>Cancel</Button><Button onClick={handleCreateDeadline} loading={creatingDeadline}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Title" required value={deadlineForm.title} onChange={(e) => setDeadlineForm(p => ({ ...p, title: e.target.value }))} placeholder="Next Hearing Date" />
          <Input label="Due Date" type="datetime-local" required value={deadlineForm.dueDate} onChange={(e) => setDeadlineForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">Type</label>
            <select value={deadlineForm.type} onChange={(e) => setDeadlineForm(p => ({ ...p, type: e.target.value }))} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none">
              <option value="hearing">Hearing</option><option value="filing">Filing</option><option value="meeting">Meeting</option><option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Lawyers Modal */}
      <Modal isOpen={showLawyersModal} onClose={() => setShowLawyersModal(false)} title="Edit Assigned Lawyers"
        footer={<><Button variant="secondary" onClick={() => setShowLawyersModal(false)}>Cancel</Button><Button onClick={handleUpdateLawyers} loading={updating}>Save Changes</Button></>}>
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
           {firmLawyers.map(l => (
             <label key={l._id} className="flex items-center gap-3 text-sm text-white cursor-pointer bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] hover:border-[#444] transition-colors">
               <input type="checkbox" checked={selectedLawyers.includes(l._id)} onChange={(e) => {
                 if (e.target.checked) setSelectedLawyers([...selectedLawyers, l._id]);
                 else setSelectedLawyers(selectedLawyers.filter(id => id !== l._id));
               }} className="accent-white w-4 h-4 cursor-pointer" />
               {l.name} <span className="text-[#555] text-xs ml-auto">{l.email}</span>
             </label>
           ))}
           {firmLawyers.length === 0 && <p className="text-[#555] text-sm">No firm lawyers available.</p>}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
        try {
          if (deleteTarget.type === 'document') {
            await dispatch(deleteDocument(deleteTarget.id)).unwrap();
          }
          toast.success('Deleted');
          setDeleteTarget(null);
        } catch (err) { toast.error(err || 'Delete failed'); }
      }} />
    </motion.div>
  );
}
