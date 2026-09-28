import { useCallback, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20

/**
 * @param initialPageSize Page size to start on. Defaults to 20, the size every
 * page but "Solicitar Membros" (15) uses. Passed in rather than set with
 * `changePageSize` from a mount effect, which would cost that page an extra
 * render and refetch on load.
 */
export function usePagination(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [currentSize, setCurrentPageSize] = useState(initialPageSize)

  const changePageSize = useCallback((size: number) => {
    setCurrentPageSize(size)
    setPage(1)
  }, [])

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const resetPage = useCallback(() => {
    setPage(1)
  }, [])

  return {
    page,
    pageSize: currentSize,
    changePageSize,
    nextPage,
    prevPage,
    resetPage,
  }
}
