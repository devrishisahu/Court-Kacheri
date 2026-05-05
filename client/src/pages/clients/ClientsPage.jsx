import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Users, Mail, Phone, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api/axios';
import { fetchClients, createClient, deleteClient } from '../../store/slices/clientSlice';
import { usePagination } from '../../hooks/usePagination';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ClientsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const { items: clients, loading } = useSelector((state) => state.clients);
  const [search, setSearch] = useState('');
  const { page, limit, meta, updateMeta, goToPage } = usePagination();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMode, setCreateMode] = useState('manual'); // 'manual' or 'search'
  const [form, setForm] = useState({ name: '', email: '', phone: '', userId: '' });

  const [registeredQuery, setRegisteredQuery] = useState('');
  const [registeredResults, setRegisteredResults] = useState([]);
  const [searchingRegistered, setSearchingRegistered] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleChat = async (clientId) => {
    try {
      const { data } = await api.post('/meetings/initiate', { clientId });
      navigate(`/chat/${data.data._id}`);
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  const loadClients = useCallback(async () => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const result = await dispatch(fetchClients(params)).unwrap();
      updateMeta(result.meta);
    } catch {
      toast.error('Failed to load clients');
    }
  }, [page, limit, search, dispatch]);

  useEffect(() => { loadClients(); }, [loadClients]);

  useEffect(() => {
    const t = setTimeout(() => goToPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Search registered users
  useEffect(() => {
    if (createMode !== 'search' || registeredQuery.length < 2) {
      setRegisteredResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingRegistered(true);
      try {
        const res = await api.get(`/firms/search-registered-clients?query=${registeredQuery}`);
        setRegisteredResults(res.data.data);
      } catch {
        // Ignore
      } finally {
        setSearchingRegistered(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [registeredQuery, createMode]);

  const handleSelectRegistered = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      userId: user._id,
      phone: ''
    });
    setCreateMode('manual');
    toast.success(`Selected ${user.name}`);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Client name is required');
    setCreating(true);
    try {
      const res = await dispatch(createClient(form)).unwrap();
      toast.success(res.message || 'Client added to base');
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', userId: '' });
      setRegisteredQuery('');
      loadClients();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteClient(deleteId)).unwrap();
      toast.success('Client removed from base');
      setDeleteId(null);
      loadClients();
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const initials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">Clients Base</h1>
        <Button onClick={() => setShowCreate(true)}><Plus size={18} /> Add Client</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client base..."
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#555555] text-sm font-['Inter'] focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-[#111111] rounded-2xl animate-pulse border border-[#2a2a2a]" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="text-[#555555] mb-4" />
          <p className="text-[#555555] text-sm font-['Inter']">No clients in your firm base yet.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setShowCreate(true)}>Add your first client</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, idx) => (
            <motion.div
              key={client._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold font-['Inter'] text-sm">
                    {initials(client.name)}
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-['Playfair_Display'] font-bold">{client.name}</h3>
                    {client.userId && <Badge variant="success" className="mt-1 text-[10px]">Registered User</Badge>}
                  </div>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-[#a0a0a0] text-sm font-['Inter'] mb-1">
                    <Mail size={14} /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-[#a0a0a0] text-sm font-['Inter'] mb-4">
                    <Phone size={14} /> {client.phone}
                  </div>
                )}
                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[#2a2a2a]">
                  <Link to={`/clients/${client._id}`} className="text-white text-xs font-['Inter'] hover:underline">History</Link>
                  {client.userId && (
                    <button 
                      onClick={() => handleChat(client.userId)}
                      className="p-1.5 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all flex items-center gap-1.5 ml-2"
                      title="Quick Chat"
                    >
                      <MessageSquare size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => setDeleteId(client._id)} className="text-[#555555] hover:text-[#f87171] text-xs font-['Inter'] ml-auto transition-colors">Remove</button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={goToPage} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add to Client Base"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} loading={creating}>Add to Base</Button></>}>
        <div className="space-y-6">
          <div className="flex p-1 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <button 
              onClick={() => setCreateMode('manual')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${createMode === 'manual' ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
            >
              Manual Entry
            </button>
            <button 
              onClick={() => setCreateMode('search')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${createMode === 'search' ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
            >
              Search Registered
            </button>
          </div>

          {createMode === 'manual' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <Input label="Name" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Rajesh Kumar" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="rajesh@example.com" />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91-9876543210" />
              {form.userId && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                  <p className="text-emerald-500 text-xs font-medium">Linked to registered user</p>
                  <button onClick={() => setForm(p => ({ ...p, userId: '' }))} className="text-emerald-500 hover:underline text-xs">Unlink</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input 
                  autoFocus
                  value={registeredQuery}
                  onChange={(e) => setRegisteredQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/40"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {searchingRegistered && <div className="text-center py-4 text-[#555] text-sm animate-pulse">Searching...</div>}
                {registeredResults.map(u => (
                  <button 
                    key={u._id}
                    onClick={() => handleSelectRegistered(u)}
                    className="w-full text-left p-4 rounded-xl border border-[#2a2a2a] bg-[#111] hover:border-white/20 transition-all group"
                  >
                    <p className="text-white font-medium group-hover:text-[#d4af37] transition-colors">{u.name}</p>
                    <p className="text-[#555] text-xs mt-0.5">{u.email}</p>
                  </button>
                ))}
                {!searchingRegistered && registeredQuery.length >= 2 && registeredResults.length === 0 && (
                  <div className="text-center py-4 text-[#555] text-sm">No registered clients found matching "{registeredQuery}"</div>
                )}
                {registeredQuery.length < 2 && (
                  <div className="text-center py-8 text-[#333] text-sm">Type at least 2 characters to search...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} message="Remove this client from your firm base? This won't delete their registered account." />
    </motion.div>
  );
}
