import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages } = meta;

  // Generate page numbers to show
  const getPages = () => {
    const items = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) items.push(i);
    return items;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-6 font-['Inter']">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {getPages().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`
            w-9 h-9 rounded-lg text-sm font-medium transition-colors
            ${p === page
              ? 'bg-white text-black'
              : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'}
          `}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="p-2 rounded-lg text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
