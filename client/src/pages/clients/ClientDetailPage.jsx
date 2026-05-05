import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClient } from '../../store/slices/clientSlice';
import { fetchCases } from '../../store/slices/caseSlice';
import { fetchInvoices } from '../../store/slices/billingSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ClientDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: client, loading } = useSelector((state) => state.clients);
  const { items: cases } = useSelector((state) => state.cases);
  const { items: invoices } = useSelector((state) => state.billing);

  useEffect(() => {
    dispatch(fetchClient(id));
    dispatch(fetchCases({ clientId: id, limit: 50 }));
    dispatch(fetchInvoices({ clientId: id, limit: 50 }));
  }, [id, dispatch]);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111111] rounded-2xl animate-pulse" />)}</div>;
  if (!client) return <p className="text-[#a0a0a0] font-['Inter']">Client not found</p>;

  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/clients" className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm font-['Inter'] mb-6">
        <ArrowLeft size={16} /> Back to Clients
      </Link>

      <Card hover={false} className="mb-8 p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold font-['Inter']">{initials}</div>
          <div>
            <h1 className="text-3xl font-bold text-white font-['Playfair_Display']">{client.name}</h1>
            {client.email && <p className="flex items-center gap-2 text-[#a0a0a0] text-sm font-['Inter'] mt-2"><Mail size={14} /> {client.email}</p>}
            {client.phone && <p className="flex items-center gap-2 text-[#a0a0a0] text-sm font-['Inter'] mt-1"><Phone size={14} /> {client.phone}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover={false}>
          <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-4">Cases ({cases.length})</h3>
          <div className="space-y-2">
            {cases.map(c => (
              <Link key={c._id} to={`/cases/${c._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-white text-sm font-['Inter']">{c.title}</p>
                  <p className="text-[#555555] text-xs font-['JetBrains_Mono']">{c.caseNumber}</p>
                </div>
                <Badge variant={c.status === 'open' ? 'white' : 'neutral'}>{c.status}</Badge>
              </Link>
            ))}
            {cases.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] text-center py-6">No cases</p>}
          </div>
        </Card>

        <Card hover={false}>
          <h3 className="text-white text-sm font-semibold font-['Inter'] uppercase tracking-wider mb-4">Invoices ({invoices.length})</h3>
          <div className="space-y-2">
            {invoices.map(inv => (
              <Link key={inv._id} to={`/billing/${inv._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="font-['JetBrains_Mono'] text-white text-sm">{inv.invoiceNumber}</p>
                  <p className="text-[#555555] text-xs font-['Inter']">{formatDate(inv.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm font-['Inter']">{formatCurrency(inv.totalAmount)}</span>
                  <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'neutral'}>{inv.status}</Badge>
                </div>
              </Link>
            ))}
            {invoices.length === 0 && <p className="text-[#555555] text-sm font-['Inter'] text-center py-6">No invoices</p>}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
