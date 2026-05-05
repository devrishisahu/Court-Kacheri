import { useState, useCallback } from 'react';

export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, pages: 0 });

  const updateMeta = useCallback((newMeta) => {
    if (newMeta) setMeta(newMeta);
  }, []);

  const goToPage = useCallback((p) => {
    setPage(Math.max(1, p));
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, meta.pages || 1));
  }, [meta.pages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return { page, limit, meta, updateMeta, goToPage, nextPage, prevPage };
}
