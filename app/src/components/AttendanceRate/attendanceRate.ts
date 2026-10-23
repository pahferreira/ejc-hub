import type { MeterTone } from '../Meter/Meter'
import type { BadgeVariant } from '../Badge/Badge'
import type { AttendanceBand, AttendanceRate } from '../../services/attendance/attendance.types'

/**
 * The one place the app maps a band to a Meter tone. Bands come from the API;
 * the app never recomputes them, only colours them.
 */
export function bandToMeterTone(band: AttendanceBand): MeterTone {
  switch (band) {
    case 'good':
      return 'success'
    case 'risky':
      return 'warning'
    case 'needs-replacement':
      return 'error'
    // insufficient-data and no-meetings are neutral.
    default:
      return 'default'
  }
}

const toneTextClasses: Record<MeterTone, string> = {
  default: 'text-dark-brown',
  success: 'text-green',
  warning: 'text-orange',
  error: 'text-red',
}

/** The text colour a rate's fraction line takes: the band's tone, like its Meter. */
export function bandToTextClass(band: AttendanceBand): string {
  return toneTextClasses[bandToMeterTone(band)]
}

export type BandBadge = { label: string; variant: BadgeVariant }

const BAND_BADGES: Partial<Record<AttendanceBand, BandBadge>> = {
  good: { label: 'Boa', variant: 'success' },
  risky: { label: 'Em risco', variant: 'warning' },
  'needs-replacement': { label: 'Precisa substituir', variant: 'error' },
}

/**
 * The Situação badge for a band, or null for the two edge states
 * (`insufficient-data`, `no-meetings`), which show nothing.
 */
export function bandToBadge(band: AttendanceBand): BandBadge | null {
  return BAND_BADGES[band] ?? null
}

/** `present/eligible`, e.g. `7/9`. */
export function formatRateFraction(rate: AttendanceRate): string {
  return `${rate.present}/${rate.eligible}`
}

/**
 * The line a rate reads as:
 * - `Sem reuniões desde a entrada` when there are no eligible meetings,
 * - `1/1 · poucos dados` when there are too few to band,
 * - `7/9 · 78%` otherwise.
 */
export function formatRatePrimary(rate: AttendanceRate): string {
  if (rate.band === 'no-meetings') {
    return 'Sem reuniões desde a entrada'
  }

  if (rate.band === 'insufficient-data') {
    return `${formatRateFraction(rate)} · poucos dados`
  }

  return `${formatRateFraction(rate)} · ${rate.percentage}%`
}

/** `2 justificadas` / `1 justificada`, or null when there are none. */
export function formatJustified(justified: number): string | null {
  if (justified <= 0) {
    return null
  }

  return `${justified} ${justified === 1 ? 'justificada' : 'justificadas'}`
}

/** Whether a rate should render a Meter. The no-meetings edge state does not. */
export function hasMeter(rate: AttendanceRate): boolean {
  return rate.band !== 'no-meetings'
}
