import { useCallback, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20

export function usePagination() {
  const [page, setPage] = useState(1)
  const [currentSize, setCurrentPageSize] = useState(DEFAULT_PAGE_SIZE)

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
