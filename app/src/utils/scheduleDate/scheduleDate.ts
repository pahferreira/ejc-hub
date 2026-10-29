const MONTHS_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const DAY_MS = 24 * 60 * 60 * 1000

// Schedule days are São Paulo calendar dates (`YYYY-MM-DD`), not instants. They
// are read as UTC midnight only to do calendar arithmetic, so the browser's own
// time zone never shifts them.
function toUtcMidnight(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toDateString(utcMidnight: Date): string {
  return utcMidnight.toISOString().slice(0, 10)
}

/**
 * The dates the "Novo dia" modal offers as chips: every São Paulo date from the
 * event's start to its end, minus the dates that already have a day.
 *
 * Empty when the event has no start or end set.
 */
export function eventDateOptions(
  startDate: string | null,
  endDate: string | null,
  takenDates: string[]
): string[] {
  if (!startDate || !endDate) {
    return []
  }

  const taken = new Set(takenDates)
  const options: string[] = []
  const end = toUtcMidnight(endDate).getTime()

  for (let time = toUtcMidnight(startDate).getTime(); time <= end; time += DAY_MS) {
    const date = toDateString(new Date(time))

    if (!taken.has(date)) {
      options.push(date)
    }
  }

  return options
}

/** The weekday of a schedule day: `Sexta`. */
export function formatScheduleWeekday(date: string): string {
  return WEEKDAYS[toUtcMidnight(date).getUTCDay()]
}

/** A schedule day's short date: `03 abr`. */
export function formatScheduleShortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${day} ${MONTHS_ABBR[Number(month) - 1]}`
}

/** A schedule day as headings and chips name it: `Sexta, 03 abr`. */
export function formatScheduleDay(date: string): string {
  return `${formatScheduleWeekday(date)}, ${formatScheduleShortDate(date)}`
}
