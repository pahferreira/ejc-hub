import type { AttendanceRosterMember } from '../../services/attendance/attendance.types'

export type MemberSortKey = 'pessoa' | 'presenca'
export type MemberSortDirection = 'asc' | 'desc'

function byPessoaAsc(a: AttendanceRosterMember, b: AttendanceRosterMember): number {
  return (
    a.nickname.localeCompare(b.nickname, 'pt-BR', { sensitivity: 'base' }) ||
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  )
}

function compare(
  a: AttendanceRosterMember,
  b: AttendanceRosterMember,
  key: MemberSortKey,
  direction: MemberSortDirection
): number {
  if (key === 'pessoa') {
    const result = byPessoaAsc(a, b)
    return direction === 'asc' ? result : -result
  }

  const pa = a.rate.percentage
  const pb = b.rate.percentage

  // A no-meetings rate has no percentage; it sorts last in either direction so
  // an absent rate never reads as a 0%.
  if (pa === null && pb === null) {
    return byPessoaAsc(a, b)
  }
  if (pa === null) {
    return 1
  }
  if (pb === null) {
    return -1
  }

  const diff = direction === 'asc' ? pa - pb : pb - pa
  return diff || byPessoaAsc(a, b)
}

/**
 * Orders the Membros table. `pessoa` sorts by nickname then full name,
 * accent-insensitively; `presenca` sorts by percentage with the no-meetings
 * rows pinned last. The page defaults to `presenca` ascending, so the people
 * most at risk sit at the top.
 */
export function sortRosterMembers(
  members: AttendanceRosterMember[],
  key: MemberSortKey,
  direction: MemberSortDirection
): AttendanceRosterMember[] {
  return [...members].sort((a, b) => compare(a, b, key, direction))
}
