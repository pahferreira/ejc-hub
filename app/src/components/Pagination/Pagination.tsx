import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { Button } from '../Button/Button'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination(props: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize))
  const isFirstPage = props.page <= 1
  const isLastPage = props.page >= totalPages

  const from = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1
  const to = Math.min(props.page * props.pageSize, props.total)

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-dark-brown">
      <span className="font-medium">
        {from}-{to} of {props.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={props.onPrev}
          disabled={isFirstPage}
          ariaLabel="Previous page"
        >
          <FiChevronLeft size={16} aria-hidden />
        </Button>
        <Button
          variant="primary"
          onClick={props.onNext}
          disabled={isLastPage}
          ariaLabel="Next page"
        >
          <FiChevronRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
