import { describe, it, expect } from 'vitest'
import {
  toMemberAttendanceRate,
  toPooledAttendanceRate,
  type MemberAttendanceRecord,
} from './attendance-rate.ts'

const JOINED_AT = new Date('2026-10-01T12:00:00Z')

// One record per status, held on consecutive days starting the day after JOINED_AT.
function records(...statuses: MemberAttendanceRecord['status'][]): MemberAttendanceRecord[] {
  return statuses.map((status, index) => ({
    heldOn: new Date(Date.UTC(2026, 9, 2 + index)).toISOString().slice(0, 10),
    status,
  }))
}

describe('toMemberAttendanceRate', () => {
  it('reports no meetings with a null percentage when nothing was held since joining', () => {
    expect(toMemberAttendanceRate(new Date('2026-10-01T12:00:00Z'), [])).toEqual({
      present: 0,
      eligible: 0,
      justified: 0,
      percentage: null,
      band: 'no-meetings',
    })
  })

  it('rates exactly 75% as good', () => {
    expect(
      toMemberAttendanceRate(JOINED_AT, records('present', 'present', 'present', 'absent'))
    ).toEqual({ present: 3, eligible: 4, justified: 0, percentage: 75, band: 'good' })
  })

  it('rates exactly 50% as risky', () => {
    expect(
      toMemberAttendanceRate(JOINED_AT, records('present', 'present', 'absent', 'absent'))
    ).toEqual({ present: 2, eligible: 4, justified: 0, percentage: 50, band: 'risky' })
  })

  it('rates just under 50% as needs-replacement', () => {
    const statuses = [
      ...Array<'present'>(99).fill('present'),
      ...Array<'absent'>(101).fill('absent'),
    ]

    // 99/200 = 49.5%.
    expect(toMemberAttendanceRate(JOINED_AT, records(...statuses))).toMatchObject({
      present: 99,
      eligible: 200,
      band: 'needs-replacement',
    })
  })

  it('withholds a band below 3 eligible meetings, even at 100%', () => {
    expect(toMemberAttendanceRate(JOINED_AT, records('present'))).toEqual({
      present: 1,
      eligible: 1,
      justified: 0,
      percentage: 100,
      band: 'insufficient-data',
    })
  })

  it('withholds a band at 2 eligible meetings, even at 0%', () => {
    expect(toMemberAttendanceRate(JOINED_AT, records('absent', 'absent'))).toMatchObject({
      eligible: 2,
      percentage: 0,
      band: 'insufficient-data',
    })
  })

  it('bands from the third eligible meeting on', () => {
    expect(toMemberAttendanceRate(JOINED_AT, records('absent', 'absent', 'absent'))).toMatchObject({
      eligible: 3,
      band: 'needs-replacement',
    })
  })

  it('leaves justified absences out of the denominator', () => {
    expect(
      toMemberAttendanceRate(
        JOINED_AT,
        records('present', 'present', 'present', 'absent', 'justified', 'justified')
      )
    ).toEqual({ present: 3, eligible: 4, justified: 2, percentage: 75, band: 'good' })
  })

  it('reports no meetings when every eligible meeting was justified', () => {
    expect(toMemberAttendanceRate(JOINED_AT, records('justified', 'justified'))).toEqual({
      present: 0,
      eligible: 0,
      justified: 2,
      percentage: null,
      band: 'no-meetings',
    })
  })

  describe('pro-rating from the join date', () => {
    it('skips meetings held before the member joined', () => {
      const rate = toMemberAttendanceRate(new Date('2026-10-05T12:00:00Z'), [
        { heldOn: '2026-10-01', status: 'absent' },
        { heldOn: '2026-10-04', status: 'absent' },
        { heldOn: '2026-10-06', status: 'present' },
        { heldOn: '2026-10-07', status: 'present' },
        { heldOn: '2026-10-08', status: 'present' },
      ])

      expect(rate).toEqual({ present: 3, eligible: 3, justified: 0, percentage: 100, band: 'good' })
    })

    it('counts a meeting held on the day the member joined', () => {
      const rate = toMemberAttendanceRate(new Date('2026-10-05T12:00:00Z'), [
        { heldOn: '2026-10-05', status: 'absent' },
      ])

      expect(rate).toMatchObject({ present: 0, eligible: 1 })
    })

    it('reads the join day in Brazil, not UTC', () => {
      // 23:30 in São Paulo on the 10th is already 02:30 UTC on the 11th.
      const rate = toMemberAttendanceRate(new Date('2026-10-11T02:30:00Z'), [
        { heldOn: '2026-10-10', status: 'present' },
      ])

      expect(rate).toMatchObject({ present: 1, eligible: 1 })
    })

    it('reports no meetings when everything was held before joining', () => {
      const rate = toMemberAttendanceRate(new Date('2026-10-05T12:00:00Z'), [
        { heldOn: '2026-10-01', status: 'present' },
      ])

      expect(rate).toEqual({
        present: 0,
        eligible: 0,
        justified: 0,
        percentage: null,
        band: 'no-meetings',
      })
    })
  })
})

describe('toPooledAttendanceRate', () => {
  function statuses(present: number, absent: number, justified: number) {
    return [
      ...Array<'present'>(present).fill('present'),
      ...Array<'absent'>(absent).fill('absent'),
      ...Array<'justified'>(justified).fill('justified'),
    ]
  }

  it('rates one meeting as present over its rows minus the justified ones', () => {
    // 13 rows, 10 present, 2 justified -> 10/11.
    expect(toPooledAttendanceRate(statuses(10, 1, 2))).toEqual({
      present: 10,
      eligible: 11,
      justified: 2,
      percentage: 90,
      band: 'good',
    })
  })

  it('pools a whole team across meetings rather than averaging member percentages', () => {
    // 115 rows across every meeting, 4 justified -> 82/111, about 73.9%.
    expect(toPooledAttendanceRate(statuses(82, 29, 4))).toEqual({
      present: 82,
      eligible: 111,
      justified: 4,
      percentage: 73,
      band: 'risky',
    })
  })

  it('reports no meetings for a team with no rows', () => {
    expect(toPooledAttendanceRate([])).toEqual({
      present: 0,
      eligible: 0,
      justified: 0,
      percentage: null,
      band: 'no-meetings',
    })
  })
})
