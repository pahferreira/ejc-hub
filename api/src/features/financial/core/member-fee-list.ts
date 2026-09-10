import type {
  EventFeeMemberFilters,
  EventFeeMemberRow,
  EventFeeMemberStats,
} from '../domain/event-fee.types.ts'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20

/**
 * Lowercases and strips diacritics so "Julia" finds "Júlia".
 *
 * pt-BR names carry accents that nobody types into a search box, and the plain
 * `toLowerCase().includes()` used for the subscriptions list quietly returns
 * nothing for them. `NFD` splits an accented letter into its base plus a
 * combining mark, which the range below then removes.
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Narrows the event's members to what the page asked for.
 *
 * Every filter is optional and they compose with AND, which is what the three
 * independent controls above the table mean. An absent filter is not the same as
 * an empty one: `name: ''` would match everything, so callers strip blanks (the
 * route schema does it with `.trim().min(1)`).
 *
 * Pure and total: no throwing, no mutation, and an unknown `teamKey` simply
 * matches nothing rather than erroring — a team can legitimately have no members.
 */
export function filterMemberFees(
  rows: EventFeeMemberRow[],
  filters: EventFeeMemberFilters = {}
): EventFeeMemberRow[] {
  const search = filters.name ? normalize(filters.name) : undefined

  return rows.filter((row) => {
    // Both names are searched: the table shows "Mari" above "Maria Silva", and a
    // treasurer typing either one expects the row back.
    if (
      search &&
      !normalize(row.name).includes(search) &&
      !normalize(row.nickname).includes(search)
    ) {
      return false
    }

    if (filters.teamKey && row.teamKey !== filters.teamKey) {
      return false
    }

    if (filters.status && row.status !== filters.status) {
      return false
    }

    return true
  })
}

/**
 * Counts for the stat cards, derived from whatever set is handed in.
 *
 * The caller decides the scope by choosing what to pass — the page passes the
 * filtered rows, so the cards summarise what the table is showing rather than
 * contradicting it.
 */
export function summarizeMemberFees(rows: EventFeeMemberRow[]): EventFeeMemberStats {
  const totalMembers = rows.length
  const paidCount = rows.filter((row) => row.status === 'paid').length

  return {
    totalMembers,
    paidCount,
    // Every row is one standing or the other, so the two always sum to the total.
    pendingCount: totalMembers - paidCount,
    // Guarded rather than left as 0/0, which would serialize as null.
    paidPercentage: totalMembers === 0 ? 0 : Math.round((paidCount / totalMembers) * 100),
  }
}

/**
 * One page of rows, matching how `Events.listCurrentEventSubscriptions` pages:
 * the repository returns the event in one shot and the slice happens here.
 *
 * A page past the end yields an empty array rather than clamping to the last
 * page, so a client that over-pages sees "nothing here" instead of silently
 * being shown different rows than it asked for.
 */
export function paginateMemberFees(
  rows: EventFeeMemberRow[],
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE
): EventFeeMemberRow[] {
  return rows.slice((page - 1) * pageSize, page * pageSize)
}
