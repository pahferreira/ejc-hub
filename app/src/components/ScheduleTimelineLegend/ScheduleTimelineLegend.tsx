import clsx from 'clsx'
import type { DriftTone } from '../../utils/scheduleClock/scheduleClock'
import { DRIFT_TONE_DOT_CLASSES, DRIFT_TONE_LABELS } from '../ScheduleDriftChip/driftToneClasses'

const TONES: DriftTone[] = ['onTime', 'late', 'early']

/** What the "Linha do tempo" dot colors mean: "No horário", "Atrasada", "Adiantada". */
export function ScheduleTimelineLegend() {
  return (
    <ul
      aria-label="Legenda"
      className="m-0 flex list-none flex-wrap gap-4 p-0 text-xs text-gray-600"
    >
      {TONES.map((tone) => (
        <li key={tone} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={clsx('h-3 w-3 rounded-full border-2 bg-white', DRIFT_TONE_DOT_CLASSES[tone])}
          />
          {DRIFT_TONE_LABELS[tone]}
        </li>
      ))}
    </ul>
  )
}
