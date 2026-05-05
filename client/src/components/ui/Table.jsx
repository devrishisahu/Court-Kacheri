import { motion } from 'framer-motion';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

export default function Table({ columns, data, loading = false, emptyMessage = 'No data found', emptyIcon }) {
  // Skeleton rows for loading state
  if (loading) {
    return (
      <div className="bg-[#111111] rounded-2xl overflow-hidden border border-[#2a2a2a]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-[#555555] text-xs uppercase tracking-widest px-6 py-4 text-left font-['Inter'] font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-[#1a1a1a]">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] rounded-2xl overflow-hidden border border-[#2a2a2a] overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2a2a2a]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-[#555555] text-xs uppercase tracking-widest px-6 py-4 text-left font-['Inter'] font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12">
                <EmptyState message={emptyMessage} icon={emptyIcon} />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <motion.tr
                key={row._id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="text-[#a0a0a0] px-6 py-4 text-sm font-['Inter']"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
