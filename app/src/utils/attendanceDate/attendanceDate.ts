const MONTHS_ABBR = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
]

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

// Splits a `YYYY-MM-DD` held-on date into numeric parts. No Date, no timezone:
// `held_on` is a calendar day, and parsing it as an instant would drift it.
function parseHeldOn(heldOn: string): { year: number; month: number; day: number } {
  const [year, month, day] = heldOn.split('-').map(Number)
  return { year, month, day }
}

/** The date block of a meeting row: the day and a three-letter month (`10` / `OUT`). */
export function formatMeetingDateBlock(heldOn: string): { day: string; month: string } {
  const { month, day } = parseHeldOn(heldOn)
  return { day: String(day).padStart(2, '0'), month: MONTHS_ABBR[month - 1] }
}

/** The pt-BR weekday a meeting was held on (`segunda-feira`). */
export function formatMeetingWeekday(heldOn: string): string {
  const { year, month, day } = parseHeldOn(heldOn)
  // UTC midnight of the parsed parts, so the weekday never drifts with the
  // browser's zone.
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

// The org runs in Brazil, so a membership's instant is read as a São Paulo
// calendar day — the same rule the API's attendance rate pro-rates against.
const SAO_PAULO_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The São Paulo calendar day of an ISO instant, as `YYYY-MM-DD`. */
export function toSaoPauloDay(iso: string): string {
  return SAO_PAULO_DAY.format(new Date(iso))
}

/** Today as a São Paulo calendar day, `YYYY-MM-DD`: the latest a meeting can be held on. */
export function todayInSaoPaulo(): string {
  return SAO_PAULO_DAY.format(new Date())
}

/** `DD/MM` of the São Paulo join day, for the roster's `entrou em DD/MM`. */
export function formatJoinDay(iso: string): string {
  const [, month, day] = toSaoPauloDay(iso).split('-')
  return `${day}/${month}`
}

/**
 * Whether a member joined after a team's first meeting, so the roster should
 * show `entrou em DD/MM`. A membership on the first meeting's day has not: the
 * meeting counts for them (`en-CA` days compare as strings).
 */
export function joinedAfterFirstMeeting(
  joinedAtIso: string,
  firstMeetingHeldOn: string | undefined
): boolean {
  if (!firstMeetingHeldOn) {
    return false
  }

  return toSaoPauloDay(joinedAtIso) > firstMeetingHeldOn
}
