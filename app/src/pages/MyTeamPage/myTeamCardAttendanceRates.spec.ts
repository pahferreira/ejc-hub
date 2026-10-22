import { describe, it, expect } from 'vitest'
import { myTeamCardAttendanceRates } from './myTeamCardAttendanceRates'
import type {
  AttendanceRate,
  AttendanceRosterMember,
  CoordinatorAttendanceReadModel,
  MemberAttendanceReadModel,
} from '../../services/attendance/attendance.types'

const goodRate: AttendanceRate = {
  present: 9,
  eligible: 9,
  justified: 0,
  percentage: 100,
  band: 'good',
}

const riskyRate: AttendanceRate = {
  present: 5,
  eligible: 8,
  justified: 2,
  percentage: 63,
  band: 'risky',
}

function rosterMember(userId: string, rate: AttendanceRate): AttendanceRosterMember {
  return {
    userId,
    name: userId,
    nickname: userId,
    pictureUrl: null,
    type: 'member',
    joinedAt: '2026-09-01T00:00:00.000Z',
    rate,
  }
}

function teamModel(roster: AttendanceRosterMember[]): CoordinatorAttendanceReadModel {
  return {
    teamInstanceId: 'team-1',
    teamAverage: goodRate,
    meetingCount: 9,
    totalRows: 18,
    justifiedTotal: 0,
    bandCounts: {
      good: 0,
      risky: 0,
      'needs-replacement': 0,
      'insufficient-data': 0,
      'no-meetings': 0,
    },
    roster,
    meetings: [],
  }
}

function myModel(rate: AttendanceRate): MemberAttendanceReadModel {
  return {
    teamInstanceId: 'team-1',
    joinedAt: '2026-09-01T00:00:00.000Z',
    rate,
    meetings: [],
  }
}

describe('myTeamCardAttendanceRates', () => {
  it("gives a coordinator every roster member's rate, keyed by user", () => {
    const rates = myTeamCardAttendanceRates({
      teamModel: teamModel([rosterMember('ana', goodRate), rosterMember('bia', riskyRate)]),
    })

    expect(rates).toEqual({ ana: goodRate, bia: riskyRate })
  })

  it('gives a member only their own rate, on their own card', () => {
    const rates = myTeamCardAttendanceRates({ myModel: myModel(riskyRate), currentUserId: 'bia' })

    expect(rates).toEqual({ bia: riskyRate })
  })

  it('gives a member nothing until their user id is known', () => {
    expect(myTeamCardAttendanceRates({ myModel: myModel(riskyRate) })).toBeUndefined()
  })

  it('gives nothing when no attendance was read (flag off or still loading)', () => {
    expect(myTeamCardAttendanceRates({ currentUserId: 'bia' })).toBeUndefined()
  })
})
