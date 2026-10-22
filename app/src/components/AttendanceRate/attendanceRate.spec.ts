import { describe, it, expect } from 'vitest'
import {
  bandToBadge,
  bandToMeterTone,
  bandToTextClass,
  formatJustified,
  formatRateFraction,
  formatRatePrimary,
  hasMeter,
} from './attendanceRate'
import type { AttendanceBand, AttendanceRate } from '../../services/attendance/attendance.types'

function rate(overrides: Partial<AttendanceRate> & Pick<AttendanceRate, 'band'>): AttendanceRate {
  return { present: 0, eligible: 0, justified: 0, percentage: null, ...overrides }
}

describe('bandToMeterTone', () => {
  const cases: Array<[AttendanceBand, string]> = [
    ['good', 'success'],
    ['risky', 'warning'],
    ['needs-replacement', 'error'],
    ['insufficient-data', 'default'],
    ['no-meetings', 'default'],
  ]

  it.each(cases)('maps %s to the %s tone', (band, tone) => {
    expect(bandToMeterTone(band)).toBe(tone)
  })
})

describe('bandToTextClass', () => {
  const cases: Array<[AttendanceBand, string]> = [
    ['good', 'text-green'],
    ['risky', 'text-orange'],
    ['needs-replacement', 'text-red'],
    ['insufficient-data', 'text-dark-brown'],
    ['no-meetings', 'text-dark-brown'],
  ]

  it.each(cases)('colours a %s rate with %s', (band, className) => {
    expect(bandToTextClass(band)).toBe(className)
  })
})

describe('bandToBadge', () => {
  it('labels the three judged bands', () => {
    expect(bandToBadge('good')).toEqual({ label: 'Boa', variant: 'success' })
    expect(bandToBadge('risky')).toEqual({ label: 'Em risco', variant: 'warning' })
    expect(bandToBadge('needs-replacement')).toEqual({
      label: 'Precisa substituir',
      variant: 'error',
    })
  })

  it('shows no badge for the two edge states', () => {
    expect(bandToBadge('insufficient-data')).toBeNull()
    expect(bandToBadge('no-meetings')).toBeNull()
  })
})

describe('formatRatePrimary', () => {
  it('reads fraction and percentage for a banded rate', () => {
    expect(formatRatePrimary(rate({ present: 7, eligible: 9, percentage: 78, band: 'good' }))).toBe(
      '7/9 · 78%'
    )
  })

  it('reads "poucos dados" instead of a percentage below three meetings', () => {
    expect(
      formatRatePrimary(
        rate({ present: 1, eligible: 1, percentage: 100, band: 'insufficient-data' })
      )
    ).toBe('1/1 · poucos dados')
  })

  it('reads the no-meetings sentence with no fraction', () => {
    expect(formatRatePrimary(rate({ band: 'no-meetings' }))).toBe('Sem reuniões desde a entrada')
  })
})

describe('formatRateFraction', () => {
  it('joins present over eligible', () => {
    expect(formatRateFraction(rate({ present: 10, eligible: 14, band: 'risky' }))).toBe('10/14')
  })
})

describe('formatJustified', () => {
  it('pluralises', () => {
    expect(formatJustified(1)).toBe('1 justificada')
    expect(formatJustified(4)).toBe('4 justificadas')
  })

  it('returns null when there are none', () => {
    expect(formatJustified(0)).toBeNull()
  })
})

describe('hasMeter', () => {
  it('hides the meter only for the no-meetings state', () => {
    expect(hasMeter(rate({ band: 'no-meetings' }))).toBe(false)
    expect(hasMeter(rate({ band: 'good' }))).toBe(true)
    expect(hasMeter(rate({ band: 'insufficient-data' }))).toBe(true)
  })
})
