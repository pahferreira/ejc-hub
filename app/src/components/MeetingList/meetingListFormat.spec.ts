import { describe, it, expect } from 'vitest'
import { countMeetingsOnDate, meetingSublineParts } from './meetingListFormat'
import type { AttendanceMeeting, AttendanceRate } from '../../services/attendance/attendance.types'

function meetingRate(overrides: Partial<AttendanceRate> = {}): AttendanceRate {
  return { present: 10, eligible: 14, justified: 0, percentage: 71, band: 'risky', ...overrides }
}

describe('countMeetingsOnDate', () => {
  it('counts the meetings that share a date', () => {
    const meetings = [{ heldOn: '2026-10-14' }, { heldOn: '2026-10-14' }, { heldOn: '2026-10-10' }]
    expect(countMeetingsOnDate(meetings, '2026-10-14')).toBe(2)
    expect(countMeetingsOnDate(meetings, '2026-10-10')).toBe(1)
  })
})

describe('meetingSublineParts', () => {
  const meeting = { heldOn: '2026-10-14', rate: meetingRate() } as AttendanceMeeting

  it('reads just the weekday for a lone meeting with no justifications', () => {
    expect(meetingSublineParts(meeting, 1)).toEqual(['quarta-feira'])
  })

  it('adds the same-day count only when the date is shared', () => {
    expect(meetingSublineParts(meeting, 2)).toEqual(['quarta-feira', '2 reuniões no dia'])
  })

  it('adds the justified count when there is one', () => {
    const withJustified = { ...meeting, rate: meetingRate({ justified: 3 }) }
    expect(meetingSublineParts(withJustified, 1)).toEqual(['quarta-feira', '3 justificadas'])
  })
})
