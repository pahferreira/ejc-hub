import type { MeterTone } from '../Meter/Meter'

export type FeeTone = MeterTone

/**
 * Maps a team's payment progress onto the three semantic tones the theme
 * already defines (`--green`, `--orange`, `--red`). The `% Pago` badge and the
 * progress bar both read from here so they can never disagree.
 *
 * A team with no members yet sits at 0% but is not a problem, so it renders
 * neutral rather than alarming.
 */
export function getFeeTone(paidPercentage: number, total: number): FeeTone {
  if (total <= 0) {
    return 'default'
  }
  if (paidPercentage >= 100) {
    return 'success'
  }
  if (paidPercentage >= 50) {
    return 'warning'
  }
  return 'error'
}
