import { normalizeText } from '../../../shared/normalize-text.ts'
import { MemberRequestStatus } from '../../../modules/member-request/domain/member-request-status.ts'
import type {
  MemberRequestQueueFilters,
  MemberRequestQueueRow,
  MemberRequestQueueStats,
} from '../domain/member-request.types.ts'

export const DEFAULT_PAGE = 1
/** 15, matching the page the screens show. */
export const DEFAULT_PAGE_SIZE = 15

/**
 * The four card counts, over the whole event.
 *
 * Computed before filtering and paging: the cards *are* the filter, so counting
 * them after it would make every card read the size of the selection it
 * produced.
 *
 * `denied` counts `denied` only. Superseded requests are `outdated` and stay
 * out, so the card never moves on an approval — and, as a consequence,
 * `outdated` and `cancelled` are reachable by no card at all. That is accepted:
 * this page is a work queue, not an audit log (plan D9 + D13).
 *
 * `disputedMembers` counts distinct *people*, not requests — the one unit
 * mismatch on the screen, which the card's caption spells out rather than hides.
 */
export function countQueueStats(rows: MemberRequestQueueRow[]): MemberRequestQueueStats {
  const disputedUserIds = new Set<string>()
  let pending = 0
  let approved = 0
  let denied = 0

  for (const row of rows) {
    if (row.status === MemberRequestStatus.Pending) {
      pending += 1

      if (row.otherPendingRequests.length > 0) {
        disputedUserIds.add(row.user.userId)
      }

      continue
    }

    if (row.status === MemberRequestStatus.Approved) {
      approved += 1
      continue
    }

    if (row.status === MemberRequestStatus.Denied) {
      denied += 1
    }
  }

  return { pending, disputedMembers: disputedUserIds.size, approved, denied }
}

/**
 * Narrows the event's requests to what the queue asked for.
 *
 * `status` and `disputed` are two axes rather than one enum, and they compose
 * honestly: `disputed=true` alone means "pending requests whose member has more
 * than one", because a disputed request's status *is* `pending` — an answered
 * one is no longer contended. The UI sends one or the other, never both, but
 * nothing here depends on that.
 *
 * `name` searches three fields — the requested person's name and nickname, and
 * the requesting coordinator's name — because the search box says "por membro ou
 * solicitante" and an admin chasing a team's asks types the coordinator.
 */
export function filterQueueRows(
  rows: MemberRequestQueueRow[],
  filters: MemberRequestQueueFilters,
  teamKeyByInstanceId: Map<string, string>
): MemberRequestQueueRow[] {
  const search = filters.name ? normalizeText(filters.name) : undefined

  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) {
      return false
    }

    if (
      filters.disputed &&
      (row.status !== MemberRequestStatus.Pending || row.otherPendingRequests.length === 0)
    ) {
      return false
    }

    if (filters.teamKey && teamKeyByInstanceId.get(row.team.id) !== filters.teamKey) {
      return false
    }

    if (
      search &&
      !normalizeText(row.user.name).includes(search) &&
      !normalizeText(row.user.nickname).includes(search) &&
      !normalizeText(row.requestedBy.name).includes(search)
    ) {
      return false
    }

    return true
  })
}

/**
 * One page of rows.
 *
 * No sorting here: the repository already returns the event newest-first, and
 * the queue offers no column sorting.
 */
export function paginateQueueRows(
  rows: MemberRequestQueueRow[],
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE
): MemberRequestQueueRow[] {
  return rows.slice((page - 1) * pageSize, page * pageSize)
}
