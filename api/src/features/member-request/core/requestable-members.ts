import { normalizeText } from '../../../shared/normalize-text.ts'
import type {
  RequestRowStatus,
  RequestableCandidateFilters,
  RequestableCandidateRow,
  RequestableStats,
} from '../domain/member-request.types.ts'

export const DEFAULT_PAGE = 1
/** 15, matching the page the screens show. Every other list in the app uses 20. */
export const DEFAULT_PAGE_SIZE = 15

/**
 * Where each row sits in the table's order.
 *
 * What this team already asked for comes first, so a coordinator sees the state
 * of their own asks before browsing; people they cannot act on sink to the
 * bottom.
 */
const ROW_STATUS_TIER: Record<RequestRowStatus, number> = {
  requested: 0,
  requestable: 1,
  assigned: 2,
}

/**
 * How one person reads to this team.
 *
 * A membership wins over an open request: someone placed elsewhere is beyond
 * asking for, whoever asked. Today the caller never passes `hasMembership: true`
 * — see `MemberRequest.#listEligibleSubscribers` — which is why `assigned` is
 * tested here but renders on nothing.
 */
export function toRowStatus(input: {
  hasMembership: boolean
  hasOpenRequestFromTeam: boolean
}): RequestRowStatus {
  if (input.hasMembership) {
    return 'assigned'
  }

  return input.hasOpenRequestFromTeam ? 'requested' : 'requestable'
}

/**
 * Narrows the eligible people to what the page asked for.
 *
 * Every filter is optional and they compose with AND, which is what four
 * independent controls above a table mean. `skills` is the exception inside
 * itself: several selected skills match a row carrying **any** of them, because
 * a coordinator ticking "Canta" and "Toca violão" is looking for either.
 *
 * Pure and total. `teamInstanceId` is the caller's own team, needed only by the
 * preference filter — "quem escolheu a minha equipe" is not expressible without
 * knowing which team is "minha".
 */
export function filterRequestableCandidates(
  rows: RequestableCandidateRow[],
  filters: RequestableCandidateFilters,
  teamInstanceId: string
): RequestableCandidateRow[] {
  const search = filters.name ? normalizeText(filters.name) : undefined

  return rows.filter((row) => {
    // Both names are searched: the table shows "Mari" above "Maria Silva", and a
    // coordinator typing either one expects the row back.
    if (
      search &&
      !normalizeText(row.name).includes(search) &&
      !normalizeText(row.nickname).includes(search)
    ) {
      return false
    }

    if (filters.skills?.length && !filters.skills.some((skill) => row.areas.includes(skill))) {
      return false
    }

    if (filters.experience && row.experienceType !== filters.experience) {
      return false
    }

    if (
      filters.preference === 'team' &&
      !row.preferences.some((preference) => preference.teamInstanceId === teamInstanceId)
    ) {
      return false
    }

    return true
  })
}

/**
 * Tier first, then nickname.
 *
 * Must run **after** filtering and **before** paging. Sorting a page instead of
 * the list is how page 2 ends up showing `Solicitado` rows that page 1 owed.
 *
 * Copies before sorting: the caller's array is also what the stats were counted
 * from, and sorting in place would make this function's position in the
 * pipeline matter for reasons that have nothing to do with order.
 */
export function sortRequestableCandidates(
  rows: RequestableCandidateRow[]
): RequestableCandidateRow[] {
  return [...rows].sort((first, second) => {
    const tierGap = ROW_STATUS_TIER[first.rowStatus] - ROW_STATUS_TIER[second.rowStatus]

    if (tierGap !== 0) {
      return tierGap
    }

    return first.nickname.localeCompare(second.nickname, 'pt-BR', { sensitivity: 'base' })
  })
}

/**
 * One page of rows.
 *
 * A page past the end yields an empty array rather than clamping to the last
 * page, so a client that over-pages sees "nothing here" instead of silently
 * being shown different rows than it asked for.
 */
export function paginateRequestableCandidates(
  rows: RequestableCandidateRow[],
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE
): RequestableCandidateRow[] {
  return rows.slice((page - 1) * pageSize, page * pageSize)
}

/**
 * The three cards, from counts the caller already holds.
 *
 * Both subtractions clamp at 0. Capacity is never enforced anywhere in this
 * codebase, so a team can legitimately hold more people than its template
 * allows and can hold more pending requests than it has room for; a card
 * reading "-2 vagas" would be arithmetic leaking through as a claim.
 */
export function toRequestableStats(input: {
  memberCount: number
  maxCapacity: number
  pendingRequests: number
  approvedRequests: number
}): RequestableStats {
  const freeSlots = Math.max(0, input.maxCapacity - input.memberCount)

  return {
    freeSlots,
    memberCount: input.memberCount,
    maxCapacity: input.maxCapacity,
    pendingRequests: input.pendingRequests,
    approvedRequests: input.approvedRequests,
    freeSlotsIfAllApproved: Math.max(0, freeSlots - input.pendingRequests),
  }
}
