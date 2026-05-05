import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  message = 'No data found',
  action,
  actionLabel,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#555555]" />
      </div>
      <p className="text-[#555555] text-sm font-['Inter'] mb-4">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="text-white text-sm font-['Inter'] underline underline-offset-4 hover:text-[#a0a0a0] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
