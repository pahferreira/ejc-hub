import { comparePeopleByNickname } from '../../../shared/compare-people-by-nickname.ts'
import { normalizeText } from '../../../shared/normalize-text.ts'
import type { ExperienceType } from '../../team-building/domain/board.types.ts'
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
 * Where each row sits in the table's order, before anything about the person.
 *
 * What this team already asked for comes first, so a coordinator sees the state
 * of their own asks before browsing; people they cannot act on sink to the
 * bottom. Outranks experience deliberately: the `Solicitado` rows are the ones
 * the coordinator is waiting on an answer for, and burying them inside the
 * newbie block is how an ask gets filed twice.
 */
const ROW_STATUS_TIER: Record<RequestRowStatus, number> = {
  requested: 0,
  requestable: 1,
  assigned: 2,
}

/**
 * Where each experience level sits in the table's order.
 *
 * Newbies first: they are the people a coordinator is actually deciding about,
 * and the ones whose circle and areas the row exists to show. The experienced
 * follow, and outsiders last.
 *
 * Explicit positions rather than sorting the value itself, because these are
 * database enum values and alphabetically they read `experienced` <
 * `experienced_outsider` < `newbie` — the wrong order, arrived at by accident.
 * Typed as a `Record<ExperienceType, number>` so a fourth level added to the
 * enum is a type error here rather than a row quietly sorting as `undefined`.
 */
const EXPERIENCE_ORDER: Record<ExperienceType, number> = {
  newbie: 0,
  experienced: 1,
  experienced_outsider: 2,
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
 * independent controls above a table mean. `skills` and `experience` are the
 * exception inside themselves: several selected values match a row carrying
 * **any** of them, because a coordinator ticking "Canta" and "Toca violão", or
 * "Encontrista" and "Encontreiro", is looking for either.
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

    if (filters.experience?.length && !filters.experience.includes(row.experienceType)) {
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
 * Status tier, then experience, then the shared people order.
 *
 * Must run **after** filtering and **before** paging. Sorting a page instead of
 * the list is how page 2 ends up showing `Solicitado` rows that page 1 owed.
 *
 * Three keys, narrowing from what the coordinator can act on to who the person
 * is: the tier floats their own open asks, experience then groups the rest,
 * because the table is read one level at a time — someone filling slots weighs
 * the newbies as a block, not an alphabetical list with the levels interleaved.
 * Within a level, `comparePeopleByNickname` gives the nickname → name → id
 * order every other roster in the app uses, and that trailing id is what keeps
 * paging stable across requests.
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

    const experienceGap =
      EXPERIENCE_ORDER[first.experienceType] - EXPERIENCE_ORDER[second.experienceType]

    if (experienceGap !== 0) {
      return experienceGap
    }

    return comparePeopleByNickname(first, second)
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
