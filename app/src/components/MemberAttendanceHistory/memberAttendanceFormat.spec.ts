import { describe, it, expect } from 'vitest'
import { formatTeamMeetingRate, statusToBadge } from './memberAttendanceFormat'
import type {
  AttendanceRate,
  MeetingAttendanceStatus,
} from '../../services/attendance/attendance.types'

describe('statusToBadge', () => {
  const cases: Array<[MeetingAttendanceStatus, string, string]> = [
    ['present', 'Presente', 'success'],
    ['absent', 'Ausente', 'error'],
    ['justified', 'Justificada', 'info'],
  ]

  it.each(cases)('shows %s as %s in the %s tone', (status, label, variant) => {
    expect(statusToBadge(status)).toEqual({ label, variant })
  })
})

describe('formatTeamMeetingRate', () => {
  it('reads the fraction and percentage, without the poucos-dados caveat', () => {
    const rate: AttendanceRate = {
      present: 1,
      eligible: 2,
      justified: 1,
      percentage: 50,
      band: 'insufficient-data',
    }

    expect(formatTeamMeetingRate(rate)).toBe('1/2 · 50%')
  })

  it('reads a dash when every row was justified', () => {
    const rate: AttendanceRate = {
      present: 0,
      eligible: 0,
      justified: 3,
      percentage: null,
      band: 'no-meetings',
    }

    expect(formatTeamMeetingRate(rate)).toBe('—')
  })
})
