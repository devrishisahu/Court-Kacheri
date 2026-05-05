import { useState } from 'react';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

export default function MeetingRequestModal({ isOpen, onClose, firm, lawyer }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    message: '',
    preferredDate: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message || !form.preferredDate) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    try {
      await api.post('/meetings/request', {
        firmId: firm?._id,
        lawyerId: lawyer?._id,
        message: form.message,
        preferredDate: form.preferredDate,
      });
      toast.success('Meeting request sent!');
      setForm({ message: '', preferredDate: '' });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request a Meeting"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 rounded-xl bg-[#d4af37]/5 border border-[#d4af37]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-xl">
            ⚖️
          </div>
          <div>
            <p className="text-white text-sm font-bold">{firm?.name || 'Independent Lawyer'}</p>
            <p className="text-[#a0a0a0] text-xs">
              {lawyer ? `Requesting with ${lawyer.name}` : 'General Firm Request'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-semibold font-['Inter']">
            Your Message <span className="text-[#f87171]">*</span>
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
            rows={4}
            placeholder="Describe the legal matter you wish to discuss..."
            className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#d4af37]/50 resize-none"
            required
          />
        </div>

        <Input
          label="Preferred Date"
          type="datetime-local"
          required
          value={form.preferredDate}
          onChange={(e) => setForm(p => ({ ...p, preferredDate: e.target.value }))}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button className="flex-1" loading={loading} type="submit">
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
