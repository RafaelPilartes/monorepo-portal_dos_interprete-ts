import { COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from './button'

export interface PaginationBarProps {
  /** 1-based current page. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

/** Previous/next bar for server-paginated lists (R-ADM-06). Hidden when one page is enough. */
export function PaginationBar({ page, pageCount, onPageChange }: PaginationBarProps) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-2 pt-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {COMMON_TEXTS.previousPage}
      </Button>
      <span className="text-sm text-muted-foreground">
        {COMMON_TEXTS.pageOf(page, pageCount)}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        {COMMON_TEXTS.nextPage}
      </Button>
    </nav>
  )
}
