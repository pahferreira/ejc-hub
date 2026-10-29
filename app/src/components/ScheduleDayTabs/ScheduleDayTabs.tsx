import clsx from 'clsx'
import { FiPlus } from 'react-icons/fi'
import type { ScheduleDay } from '../../services/schedule/schedule.types'
import {
  formatScheduleShortDate,
  formatScheduleWeekday,
} from '../../utils/scheduleDate/scheduleDate'
import { pluralize } from '../../utils/pluralize/pluralize'

export type ScheduleDayTabsProps = {
  /** Earliest first, as the API sends them. */
  days: ScheduleDay[]
  selectedDayId: string | null
  onSelectDay: (dayId: string) => void
  onNewDay: () => void
}

/**
 * One tab per schedule day — the weekday over "03 abr · N atividades" — then a
 * dashed "+ Novo dia" tab that opens the new-day modal.
 */
export function ScheduleDayTabs(props: ScheduleDayTabsProps) {
  return (
    <div role="tablist" aria-label="Dias do cronograma" className="flex flex-wrap gap-3">
      {props.days.map((day) => {
        const isSelected = day.id === props.selectedDayId

        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => props.onSelectDay(day.id)}
            className={clsx(
              'flex min-w-36 flex-col items-start rounded-xl border-2 px-4 py-2 text-left hover:cursor-pointer',
              isSelected
                ? 'border-dark-brown bg-primary text-white button-shadow'
                : 'border-tertiary bg-white text-dark-brown hover:border-dark-brown/50'
            )}
          >
            <span className="text-sm font-semibold">{formatScheduleWeekday(day.date)}</span>
            <span className={clsx('text-xs', isSelected ? 'text-white/85' : 'text-gray-600')}>
              {formatScheduleShortDate(day.date)} ·{' '}
              {pluralize(
                day.activityCount,
                `${day.activityCount} atividade`,
                `${day.activityCount} atividades`
              )}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={props.onNewDay}
        className="flex min-w-36 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-brown/40 bg-transparent px-4 py-2 text-sm font-semibold text-dark-brown hover:cursor-pointer hover:border-dark-brown"
      >
        <FiPlus aria-hidden /> Novo dia
      </button>
    </div>
  )
}
