import { describe, it, expect } from 'vitest'
import { sortRosterMembers } from './membersAttendanceSort'
import type {
  AttendanceBand,
  AttendanceRosterMember,
} from '../../services/attendance/attendance.types'

function member(
  userId: string,
  name: string,
  percentage: number | null,
  band: AttendanceBand = 'good'
): AttendanceRosterMember {
  return {
    userId,
    name,
    nickname: name.split(' ')[0],
    pictureUrl: null,
    type: 'member',
    joinedAt: '2026-10-01T12:00:00Z',
    rate: { present: 0, eligible: 0, justified: 0, percentage, band },
  }
}

describe('sortRosterMembers', () => {
  it('orders by presença ascending with no-meetings last', () => {
    const members = [
      member('a', 'Ana', 80),
      member('b', 'Bruno', 25),
      member('c', 'Caio', null, 'no-meetings'),
      member('d', 'Duda', 50),
    ]

    expect(sortRosterMembers(members, 'presenca', 'asc').map((m) => m.userId)).toEqual([
      'b',
      'd',
      'a',
      'c',
    ])
  })

  it('keeps no-meetings last even sorting presença descending', () => {
    const members = [
      member('a', 'Ana', 80),
      member('c', 'Caio', null, 'no-meetings'),
      member('b', 'Bruno', 25),
    ]

    expect(sortRosterMembers(members, 'presenca', 'desc').map((m) => m.userId)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('orders by pessoa accent-insensitively', () => {
    const members = [member('a', 'Ângela', 10), member('b', 'Bruno', 90), member('c', 'ana', 50)]

    expect(sortRosterMembers(members, 'pessoa', 'asc').map((m) => m.nickname)).toEqual([
      'ana',
      'Ângela',
      'Bruno',
    ])
  })

  it('breaks a pessoa tie on the full name, then the id, like /my-team', () => {
    const sameNickname = (userId: string, name: string) => ({
      ...member(userId, name, 50),
      nickname: 'Ju',
    })
    const members = [
      sameNickname('z', 'Juliana Alves'),
      sameNickname('b', 'Bruno Lima'),
      sameNickname('a', 'Juliana Alves'),
    ]

    expect(sortRosterMembers(members, 'pessoa', 'asc').map((m) => m.userId)).toEqual([
      'b',
      'a',
      'z',
    ])
  })

  it('does not mutate the input array', () => {
    const members = [member('a', 'Ana', 80), member('b', 'Bruno', 25)]
    const order = members.map((m) => m.userId)

    sortRosterMembers(members, 'presenca', 'asc')

    expect(members.map((m) => m.userId)).toEqual(order)
  })
})
