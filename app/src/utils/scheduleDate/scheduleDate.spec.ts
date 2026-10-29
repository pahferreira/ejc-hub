import { describe, it, expect } from 'vitest'
import { eventDateOptions, formatScheduleDay, formatScheduleShortDate } from './scheduleDate'

describe('eventDateOptions', () => {
  it('lists every São Paulo date from the event start to its end', () => {
    expect(eventDateOptions('2026-04-03', '2026-04-05', [])).toEqual([
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
    ])
  })

  it('leaves out the dates that already have a day', () => {
    expect(eventDateOptions('2026-04-03', '2026-04-05', ['2026-04-04'])).toEqual([
      '2026-04-03',
      '2026-04-05',
    ])
  })

  it('crosses a month boundary', () => {
    expect(eventDateOptions('2026-04-30', '2026-05-01', [])).toEqual(['2026-04-30', '2026-05-01'])
  })

  it('offers a one-day event its single date', () => {
    expect(eventDateOptions('2026-04-03', '2026-04-03', [])).toEqual(['2026-04-03'])
  })

  it('offers nothing when every date is taken', () => {
    expect(eventDateOptions('2026-04-03', '2026-04-04', ['2026-04-03', '2026-04-04'])).toEqual([])
  })

  it('offers nothing when the event has no dates', () => {
    expect(eventDateOptions(null, '2026-04-05', [])).toEqual([])
    expect(eventDateOptions('2026-04-03', null, [])).toEqual([])
  })
})

describe('formatScheduleDay', () => {
  it('reads the weekday and the short date', () => {
    // 2026-04-03 is a Friday.
    expect(formatScheduleDay('2026-04-03')).toBe('Sexta, 03 abr')
  })

  it('names Saturday with its accent', () => {
    expect(formatScheduleDay('2026-04-04')).toBe('Sábado, 04 abr')
  })
})

describe('formatScheduleShortDate', () => {
  it('reads a padded day and a lowercase month', () => {
    expect(formatScheduleShortDate('2026-12-05')).toBe('05 dez')
  })
})
