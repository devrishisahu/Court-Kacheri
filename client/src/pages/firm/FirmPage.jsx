import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFirm, createFirm } from '../../store/slices/firmSlice';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

export default function FirmPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { data: firm, loading } = useSelector((state) => state.firm);
  const [showModal, setShowModal] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState([]);

  const loadInvites = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await api.get('/firms/invites');
      setInvites(res.data.data);
    } catch (err) {
      console.error('Failed to load invites', err);
    }
  };

  useEffect(() => {
    dispatch(fetchFirm());
    loadInvites();
  }, [dispatch]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await api.post('/firms/invites', { email: inviteEmail });
      toast.success('Invite sent successfully!');
      setInviteEmail('');
      loadInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCreate = async () => {
    if (!firmName.trim()) return;
    setCreating(true);
    try {
      await dispatch(createFirm({ name: firmName.trim() })).unwrap();
      setShowModal(false);
      setFirmName('');
      toast.success('Firm created!', {
        iconTheme: { primary: '#4ade80', secondary: '#111111' },
      });
    } catch (err) {
      toast.error(err || 'Failed to create firm');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#111111] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!firm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <EmptyState
          icon={Scale}
          message="You're not part of any firm yet."
          action={() => setShowModal(true)}
          actionLabel="Create Your Firm"
        />

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Your Firm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={creating}>
                Create Firm
              </Button>
            </>
          }
        >
          <Input
            label="Firm Name"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            placeholder="Sharma & Associates"
            required
          />
        </Modal>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-8">
        My Firm
      </h1>

      <Card hover={false} className="p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <Building size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-white font-['Playfair_Display'] mb-4">
              {firm.name}
            </h2>
            <div className="space-y-2">
              <p className="text-[#a0a0a0] text-sm font-['Inter']">
                <span className="text-[#555555]">Created by:</span>{' '}
                {firm.createdBy?.name || 'Unknown'} ({firm.createdBy?.email})
              </p>
              <p className="text-[#a0a0a0] text-sm font-['Inter']">
                <span className="text-[#555555]">Established:</span>{' '}
                {formatDate(firm.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Invite section */}
      {user?.role === 'admin' && (
      <Card hover={false} className="mt-6 p-8">
        <div className="mb-6">
          <h3 className="text-white text-xl font-semibold font-['Playfair_Display']">
            Invite Lawyers
          </h3>
          <p className="text-[#a0a0a0] text-sm font-['Inter'] mt-1">
            Send an invitation to join your firm. They will see it on their dashboard when they log in.
          </p>
        </div>
        
        <form onSubmit={handleInvite} className="flex gap-4 items-end mb-8">
          <div className="flex-1">
            <Input 
              label="Lawyer's Email" 
              type="email" 
              placeholder="lawyer@example.com" 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={inviting}>Send Invite</Button>
        </form>

        {invites.length > 0 && (
          <div>
            <h4 className="text-white text-sm font-medium mb-3">Recent Invites</h4>
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv._id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                  <span className="text-white text-sm">{inv.email}</span>
                  <Badge variant={inv.status === 'pending' ? 'neutral' : (inv.status === 'accepted' ? 'white' : 'neutral')}>{inv.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      )}
    </motion.div>
  );
}
