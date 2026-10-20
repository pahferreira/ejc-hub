import type {
  AttendanceRosterMember,
  MeetingAttendanceStatus,
  RegisterMeetingBody,
} from '../../services/attendance/attendance.types'

/**
 * The Registrar reunião drawer's form.
 *
 * One status per row is structural: `statuses` holds a single value per person,
 * and anyone missing from it is `absent`. Present and justified can't overlap
 * because there is nowhere to write both.
 */
export type MeetingForm = {
  /** `YYYY-MM-DD`. */
  heldOn: string
  title: string
  description: string
  statuses: Record<string, MeetingAttendanceStatus>
  /** Kept only while the row is `justified`. */
  reasons: Record<string, string>
}

export function initialMeetingForm(today: string): MeetingForm {
  return { heldOn: today, title: '', description: '', statuses: {}, reasons: {} }
}

export function rowStatus(form: MeetingForm, userId: string): MeetingAttendanceStatus {
  return form.statuses[userId] ?? 'absent'
}

// Writes one row's status and drops its reason unless the row stays justified,
// so a stale justification never survives a tick.
function withStatus(
  form: MeetingForm,
  userId: string,
  status: MeetingAttendanceStatus
): MeetingForm {
  const statuses = { ...form.statuses, [userId]: status }
  const reasons = { ...form.reasons }

  if (status !== 'justified') {
    delete reasons[userId]
  }

  return { ...form, statuses, reasons }
}

export function setPresent(form: MeetingForm, userId: string, present: boolean): MeetingForm {
  return withStatus(form, userId, present ? 'present' : 'absent')
}

export function justify(form: MeetingForm, userId: string): MeetingForm {
  return { ...withStatus(form, userId, 'justified'), reasons: { ...form.reasons, [userId]: '' } }
}

export function clearJustification(form: MeetingForm, userId: string): MeetingForm {
  return withStatus(form, userId, 'absent')
}

export function setReason(form: MeetingForm, userId: string, reason: string): MeetingForm {
  return { ...form, reasons: { ...form.reasons, [userId]: reason } }
}

/**
 * Ticks (or unticks) everyone given — the rows the search currently shows.
 *
 * Unticking leaves a justified row alone: "Desmarcar todos" undoes ticks, it
 * does not throw away reasons someone typed.
 */
export function markAll(form: MeetingForm, userIds: string[], present: boolean): MeetingForm {
  return userIds.reduce((next, userId) => {
    if (!present && rowStatus(next, userId) !== 'present') {
      return next
    }

    return setPresent(next, userId, present)
  }, form)
}

// Lowercased and stripped of accents, so `joao` finds João.
function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function filterRoster(
  roster: AttendanceRosterMember[],
  search: string
): AttendanceRosterMember[] {
  const query = normalizeForSearch(search.trim())

  if (!query) {
    return roster
  }

  return roster.filter(
    (member) =>
      normalizeForSearch(member.name).includes(query) ||
      normalizeForSearch(member.nickname).includes(query)
  )
}

export function groupRoster(roster: AttendanceRosterMember[]) {
  return {
    coordinators: roster.filter((member) => member.type === 'coordinator'),
    members: roster.filter((member) => member.type !== 'coordinator'),
  }
}

export type AttendanceTally = Record<MeetingAttendanceStatus, number>

/** The footer's `N presentes · N ausentes · N justificadas`, over the whole roster. */
export function tallyAttendance(
  form: MeetingForm,
  roster: AttendanceRosterMember[]
): AttendanceTally {
  const tally: AttendanceTally = { present: 0, absent: 0, justified: 0 }

  for (const member of roster) {
    tally[rowStatus(form, member.userId)] += 1
  }

  return tally
}

export type MeetingFormValidation = {
  isValid: boolean
  heldOn?: string
  /** One message per justified row with a blank reason, by user id. */
  reasons: Record<string, string>
}

/**
 * The same rules the API enforces, so the drawer can stop a save before it
 * leaves. Overlap and non-roster ids need no check here: the form can't
 * express the one, and `toRegisterMeetingBody` never sends the other.
 *
 * `today` is the São Paulo day, `YYYY-MM-DD`; days compare as strings.
 */
export function validateMeetingForm(
  form: MeetingForm,
  roster: AttendanceRosterMember[],
  today: string
): MeetingFormValidation {
  const reasons: Record<string, string> = {}

  for (const member of roster) {
    const isJustified = rowStatus(form, member.userId) === 'justified'

    if (isJustified && !(form.reasons[member.userId] ?? '').trim()) {
      reasons[member.userId] = 'Informe a justificativa.'
    }
  }

  let heldOn: string | undefined

  if (!form.heldOn) {
    heldOn = 'Informe a data da reunião.'
  } else if (form.heldOn > today) {
    heldOn = 'A data da reunião não pode ser no futuro.'
  }

  const isValid = heldOn === undefined && Object.keys(reasons).length === 0

  return heldOn === undefined ? { isValid, reasons } : { isValid, heldOn, reasons }
}

/**
 * The `POST /attendance/meetings` body. Only roster members are read, so a
 * status left on someone who has since left the team is never sent.
 */
export function toRegisterMeetingBody(
  form: MeetingForm,
  roster: AttendanceRosterMember[]
): RegisterMeetingBody {
  const presentUserIds: string[] = []
  const justified: RegisterMeetingBody['justified'] = []

  for (const member of roster) {
    const status = rowStatus(form, member.userId)

    if (status === 'present') {
      presentUserIds.push(member.userId)
    } else if (status === 'justified') {
      justified.push({ userId: member.userId, reason: (form.reasons[member.userId] ?? '').trim() })
    }
  }

  return {
    heldOn: form.heldOn,
    title: form.title.trim() || undefined,
    description: form.description.trim() || undefined,
    presentUserIds,
    justified,
  }
}
