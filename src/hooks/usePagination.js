import { useEffect, useState } from "react";

export default function usePagination(items, options = {}) {
  const { initialPageSize = 6, resetKey = "" } = options;
  const safeItems = Array.isArray(items) ? items : [];
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const paginatedItems = safeItems.slice(currentStart, currentStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, resetKey]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    setPageSize,
    totalItems,
    totalPages,
  };
}
