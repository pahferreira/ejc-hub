import type { DriftTone } from '../../utils/scheduleClock/scheduleClock'

/** A drift chip's border and text: late red, early blue, on time green. */
export const DRIFT_TONE_CHIP_CLASSES: Record<DriftTone, string> = {
  late: 'border-red text-red',
  early: 'border-blue text-blue',
  onTime: 'border-green text-green',
}

/** A timeline row's dot and the legend's swatches, in the same colors. */
export const DRIFT_TONE_DOT_CLASSES: Record<DriftTone, string> = {
  late: 'border-red',
  early: 'border-blue',
  onTime: 'border-green',
}

/** What the legend calls each tone, for a row's activity. */
export const DRIFT_TONE_LABELS: Record<DriftTone, string> = {
  onTime: 'No horário',
  late: 'Atrasada',
  early: 'Adiantada',
}
