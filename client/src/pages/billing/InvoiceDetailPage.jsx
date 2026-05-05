import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoice, updateInvoiceStatus } from '../../store/slices/billingSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const { current: invoice, loading } = useSelector((state) => state.billing);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoice(id));
  }, [id, dispatch]);

  const handleUpdateStatus = async (status) => {
    setUpdating(true);
    try {
      await dispatch(updateInvoiceStatus({ id, status })).unwrap();
      toast.success(`Status updated to ${status}`);
      dispatch(fetchInvoice(id));
    } catch (err) {
      toast.error(err || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111111] rounded-2xl animate-pulse" />)}</div>;
  if (!invoice) return <p className="text-[#a0a0a0] font-['Inter']">Invoice not found</p>;

  const statusBadge = (s) => {
    const m = { draft: 'neutral', sent: 'info', paid: 'success', overdue: 'danger' };
    return <Badge variant={m[s] || 'neutral'}>{s}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/billing" className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm font-['Inter'] mb-6">
        <ArrowLeft size={16} /> Back to Billing
      </Link>

      {/* Invoice Card — Print-ready */}
      <Card hover={false} className="relative overflow-hidden p-8 md:p-12 print:shadow-none print:border-none">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1a1a1a] text-8xl md:text-9xl font-bold font-['Playfair_Display'] pointer-events-none select-none opacity-50">
          INVOICE
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white font-['Playfair_Display']">⚖ Court-Kacheri</h2>
              <p className="text-[#555555] text-sm font-['Inter'] mt-1">Legal Case Management</p>
            </div>
            <div className="text-right">
              <p className="font-['JetBrains_Mono'] text-white text-lg">{invoice.invoiceNumber}</p>
              <div className="mt-2">{statusBadge(invoice.status)}</div>
            </div>
          </div>

          {/* From/To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-2">From</p>
              <p className="text-white font-['Inter']">Your Firm</p>
            </div>
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-2">Bill To</p>
              <p className="text-white font-['Inter']">{invoice.clientId?.name || '—'}</p>
              {invoice.clientId?.email && <p className="text-[#a0a0a0] text-sm font-['Inter']">{invoice.clientId.email}</p>}
              {invoice.clientId?.phone && <p className="text-[#a0a0a0] text-sm font-['Inter']">{invoice.clientId.phone}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-1">Invoice Date</p>
              <p className="text-white text-sm font-['Inter']">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-1">Due Date</p>
              <p className="text-white text-sm font-['Inter']">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</p>
            </div>
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-1">Case</p>
              <p className="text-white text-sm font-['Inter']">{invoice.caseId?.title || '—'}</p>
            </div>
            <div>
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-1">Case No.</p>
              <p className="text-white text-sm font-['JetBrains_Mono']">{invoice.caseId?.caseNumber || '—'}</p>
            </div>
          </div>

          {/* Items table */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="mb-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-[#555555] text-xs uppercase tracking-widest text-left py-3 font-['Inter'] font-medium">Description</th>
                    <th className="text-[#555555] text-xs uppercase tracking-widest text-right py-3 font-['Inter'] font-medium">Hours</th>
                    <th className="text-[#555555] text-xs uppercase tracking-widest text-right py-3 font-['Inter'] font-medium">Rate</th>
                    <th className="text-[#555555] text-xs uppercase tracking-widest text-right py-3 font-['Inter'] font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#1a1a1a]">
                      <td className="text-[#a0a0a0] text-sm py-3 font-['Inter']">{item.description}</td>
                      <td className="text-[#a0a0a0] text-sm py-3 font-['JetBrains_Mono'] text-right">{item.hours}</td>
                      <td className="text-[#a0a0a0] text-sm py-3 font-['JetBrains_Mono'] text-right">{formatCurrency(item.rate)}/hr</td>
                      <td className="text-white text-sm py-3 font-['JetBrains_Mono'] text-right font-semibold">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="text-right">
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-white font-['Playfair_Display']">{formatCurrency(invoice.totalAmount)}</p>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-6 border-t border-[#2a2a2a]">
              <p className="text-[#555555] text-xs uppercase tracking-wider font-['Inter'] mb-2">Notes</p>
              <p className="text-[#a0a0a0] text-sm font-['Inter'] leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6 print:hidden">
        {isAdmin && invoice.status === 'draft' && (
          <Button onClick={() => handleUpdateStatus('sent')} loading={updating} variant="secondary">Mark as Sent</Button>
        )}
        {isAdmin && (invoice.status === 'sent' || invoice.status === 'draft') && (
          <Button onClick={() => handleUpdateStatus('paid')} loading={updating}>Mark as Paid</Button>
        )}
        {isAdmin && invoice.status === 'sent' && (
          <Button onClick={() => handleUpdateStatus('overdue')} loading={updating} variant="danger">Mark as Overdue</Button>
        )}
        <Button onClick={() => window.print()} variant="ghost"><Printer size={16} /> Print</Button>
      </div>
    </motion.div>
  );
}
