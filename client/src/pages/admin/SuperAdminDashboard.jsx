import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Flag, 
  Search,
  ChevronLeft,
  ChevronRight,
  Scale,
  Building2,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('firms');
  const [users, setUsers] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [expandedFirm, setExpandedFirm] = useState(null);
  const [firmLawyers, setFirmLawyers] = useState({});
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { page, limit: 10, search, role: roleFilter }
      });
      setUsers(response.data.data);
      setTotal(response.data.meta.total);
    } catch (err) {
      toast.error('Failed to fetch users');
      if (err.response?.status === 403) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/firms');
      setFirms(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch firms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'firms') fetchFirms();
    else fetchUsers();
  }, [page, search, roleFilter, activeTab]);

  const toggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/status`);
      toast.success('Status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const toggleFlag = async (userId, currentFlag) => {
    if (!window.confirm(`Are you sure you want to ${currentFlag ? 'unflag' : 'flag'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/flag`);
      toast.success('Flag status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const fetchFirmLawyers = async (firmId) => {
    if (firmLawyers[firmId]) return;
    try {
      const response = await api.get(`/admin/firms/${firmId}/lawyers`);
      setFirmLawyers(prev => ({ ...prev, [firmId]: response.data.data }));
    } catch (err) {
      toast.error('Failed to fetch firm lawyers');
    }
  };

  const toggleFirmExpand = (firmId) => {
    if (expandedFirm === firmId) setExpandedFirm(null);
    else {
      setExpandedFirm(firmId);
      fetchFirmLawyers(firmId);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-['Inter']">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                <Scale className="text-[#d4af37]" size={20} />
              </div>
              <h1 className="text-3xl font-bold font-['Playfair_Display'] italic tracking-wide">
                Super Admin Panel
              </h1>
            </div>
            <div className="flex gap-6 mt-4 border-b border-white/5">
              {[
                { id: 'firms', label: 'Firms Oversight', icon: Building2 },
                { id: 'lawyers', label: 'All Lawyers', icon: Scale },
                { id: 'clients', label: 'Client Base', icon: Users },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'lawyers') setRoleFilter('lawyer');
                    else if (tab.id === 'clients') setRoleFilter('client');
                    else setRoleFilter('');
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold pb-3 border-b-2 transition-all ${
                    activeTab === tab.id ? 'text-[#d4af37] border-[#d4af37]' : 'text-[#555] border-transparent hover:text-white'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(activeTab === 'lawyers' || activeTab === 'clients') && (
              <motion.div 
                key="user-controls"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 w-full md:w-auto"
              >
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[#d4af37]/50 outline-none transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Views */}
        {(activeTab === 'lawyers' || activeTab === 'clients') ? (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Users', value: total, icon: Users },
                { label: 'Security Status', value: 'Nominal', icon: ShieldAlert },
                { label: 'Flagged Accounts', value: users.filter(u => u.isFlagged).length, icon: Flag }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 group hover:border-[#d4af37]/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#555] text-xs uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold font-['Playfair_Display']">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-[#d4af37]">
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-5 text-[#555] text-xs uppercase tracking-widest font-medium">Identity</th>
                      <th className="px-6 py-5 text-[#555] text-xs uppercase tracking-widest font-medium">Role</th>
                      <th className="px-6 py-5 text-[#555] text-xs uppercase tracking-widest font-medium">Status</th>
                      <th className="px-6 py-5 text-[#555] text-xs uppercase tracking-widest font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#d4af37] font-bold text-sm">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              <p className="text-xs text-[#555]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border bg-white/5 text-[#888] border-white/10">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-xs ${user.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => toggleStatus(user._id, user.isActive)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                              {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button onClick={() => toggleFlag(user._id, user.isFlagged)} className={`p-2 rounded-lg transition-all ${user.isFlagged ? 'text-red-500 bg-red-500/10' : 'bg-white/5'}`}>
                              <Flag size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {firms.map((firm) => (
              <div key={firm._id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 text-[#d4af37]">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-['Playfair_Display']">{firm.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-[#555] text-xs">
                          <Mail size={12} /> {firm.adminEmail || 'No admin contact'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#555] text-xs">
                          <Users size={12} /> {firm.lawyerCount} Lawyers
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleFirmExpand(firm._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      {expandedFirm === firm._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expandedFirm === firm._id ? 'Close Details' : 'View Team'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedFirm === firm._id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-white/[0.01]"
                    >
                      <div className="p-6 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[#555] text-[10px] uppercase tracking-[0.2em] font-bold">
                              <th className="pb-4">Lawyer Name</th>
                              <th className="pb-4">Email</th>
                              <th className="pb-4">Status</th>
                              <th className="pb-4 text-right">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {firmLawyers[firm._id]?.map(l => (
                              <tr key={l._id} className="text-sm">
                                <td className="py-4 font-medium">{l.name}</td>
                                <td className="py-4 text-[#a0a0a0]">{l.email}</td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                    {l.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </td>
                                <td className="py-4 text-right text-[#555] text-xs">
                                  {new Date(l.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                            {(!firmLawyers[firm._id] || firmLawyers[firm._id].length === 0) && (
                              <tr>
                                <td colSpan="4" className="py-8 text-center text-[#555] italic text-sm">
                                  No lawyers found under this firm
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
