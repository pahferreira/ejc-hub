import { describe, it, expect } from 'vitest'
import {
  formatJoinDay,
  formatMeetingDateBlock,
  formatMeetingWeekday,
  joinedAfterFirstMeeting,
  toSaoPauloDay,
} from './attendanceDate'

describe('formatMeetingDateBlock', () => {
  it('reads the day and a three-letter uppercase month', () => {
    expect(formatMeetingDateBlock('2026-10-14')).toEqual({ day: '14', month: 'OUT' })
  })

  it('pads a single-digit day', () => {
    expect(formatMeetingDateBlock('2026-01-05')).toEqual({ day: '05', month: 'JAN' })
  })
})

describe('formatMeetingWeekday', () => {
  it('reads the pt-BR weekday without drifting by timezone', () => {
    // 2026-10-14 is a Wednesday.
    expect(formatMeetingWeekday('2026-10-14')).toBe('quarta-feira')
  })
})

describe('toSaoPauloDay', () => {
  it('reads an evening instant as the same São Paulo day, not the next UTC one', () => {
    // 23:30 in São Paulo on the 10th is 02:30 UTC on the 11th.
    expect(toSaoPauloDay('2026-10-11T02:30:00Z')).toBe('2026-10-10')
  })
})

describe('formatJoinDay', () => {
  it('reads DD/MM of the São Paulo join day', () => {
    expect(formatJoinDay('2026-10-14T12:00:00Z')).toBe('14/10')
  })
})

describe('joinedAfterFirstMeeting', () => {
  it('is true when the join day is after the first meeting', () => {
    expect(joinedAfterFirstMeeting('2026-10-10T12:00:00Z', '2026-10-05')).toBe(true)
  })

  it('is false on the first meeting day itself', () => {
    expect(joinedAfterFirstMeeting('2026-10-05T12:00:00Z', '2026-10-05')).toBe(false)
  })

  it('is false when there are no meetings yet', () => {
    expect(joinedAfterFirstMeeting('2026-10-10T12:00:00Z', undefined)).toBe(false)
  })
})
