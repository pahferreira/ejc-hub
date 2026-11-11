import { normalizeText } from '../../../shared/normalize-text.ts'
import { MemberRequestStatus } from '../../../modules/member-request/domain/member-request-status.ts'
import type {
  MyTeamRequestFilters,
  MyTeamRequestRow,
  MyTeamRequestStats,
} from '../domain/member-request.types.ts'

/**
 * The three cards above the coordinator's own list.
 *
 * Computed over the **full unfiltered** set, before `name`/`status` narrow
 * `items` — the house invariant this page shares with the admin queue (plan
 * I.2). `cancelled` and `outdated` have no card, so they are never counted
 * here even though `status` can still select them from the list below (plan
 * I.7).
 */
export function countMyTeamStats(rows: MyTeamRequestRow[]): MyTeamRequestStats {
  let pending = 0
  let approved = 0
  let denied = 0

  for (const row of rows) {
    if (row.status === MemberRequestStatus.Pending) {
      pending += 1
    } else if (row.status === MemberRequestStatus.Approved) {
      approved += 1
    } else if (row.status === MemberRequestStatus.Denied) {
      denied += 1
    }
  }

  return { pending, approved, denied }
}

/**
 * Narrows the team's requests to what the page asked for.
 *
 * `name` searches the **requested member's** name and nickname only, never the
 * filer's (plan I.4) — on a single team the filer is always a teammate, so
 * searching them would surface nothing the coordinator doesn't already know.
 */
export function filterMyTeamRows(
  rows: MyTeamRequestRow[],
  filters: MyTeamRequestFilters
): MyTeamRequestRow[] {
  const search = filters.name ? normalizeText(filters.name) : undefined

  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) {
      return false
    }

    if (
      search &&
      !normalizeText(row.user.name).includes(search) &&
      !normalizeText(row.user.nickname).includes(search)
    ) {
      return false
    }

    return true
  })
}
