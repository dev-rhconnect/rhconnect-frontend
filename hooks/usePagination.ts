import { useState, useEffect } from 'react'

export const PAGE_SIZE = 10

export function usePagination<T>(items: T[], resetKey: string, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [resetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const start      = (safePage - 1) * pageSize
  const end        = Math.min(start + pageSize, items.length)

  return {
    paged: items.slice(start, end),
    page:  safePage,
    setPage,
    totalPages,
    total: items.length,
    from:  items.length === 0 ? 0 : start + 1,
    to:    end,
  }
}
