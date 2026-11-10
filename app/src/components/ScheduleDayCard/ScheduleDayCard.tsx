import clsx from 'clsx'
import {
  formatScheduleLongDate,
  formatScheduleWeekday,
  formatScheduleWeekdayAbbr,
} from '../../utils/scheduleDate/scheduleDate'

export type ScheduleDayCardProps = {
  /** 1-based position among the planned days: the "DIA 1". */
  dayNumber: number
  /** `YYYY-MM-DD`, a São Paulo date. */
  date: string
  isSelected: boolean
  onSelect: () => void
}

/**
 * One Cronograma day as a tab: "DIA 1 · SEX" over "Sexta" over "3 Abr 2026".
 * Render inside an element with `role="tablist"`.
 */
export function ScheduleDayCard(props: ScheduleDayCardProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.isSelected}
      onClick={props.onSelect}
      className={clsx(
        'flex min-w-36 flex-col items-start rounded-xl border-2 px-4 py-3 text-left hover:cursor-pointer',
        props.isSelected
          ? 'border-dark-brown bg-primary text-white button-shadow'
          : 'border-tertiary bg-white text-dark-brown hover:border-dark-brown/50'
      )}
    >
      <span
        className={clsx(
          'text-xs font-semibold tracking-wide',
          props.isSelected ? 'text-white/85' : 'text-primary'
        )}
      >
        DIA {props.dayNumber} · {formatScheduleWeekdayAbbr(props.date)}
      </span>
      <span className="text-lg font-bold">{formatScheduleWeekday(props.date)}</span>
      <span className={clsx('text-xs', props.isSelected ? 'text-white/85' : 'text-gray-600')}>
        {formatScheduleLongDate(props.date)}
      </span>
    </button>
  )
}
