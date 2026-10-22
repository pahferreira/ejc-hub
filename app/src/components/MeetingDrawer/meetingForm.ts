import type {
  AttendanceMeeting,
  AttendancePerson,
  AttendanceRosterMember,
  MeetingAttendanceStatus,
  RegisterMeetingBody,
} from '../../services/attendance/attendance.types'
import type { TeamMembershipType } from '../../services/teams/teams.types'

/**
 * One row the drawer lists. `removed` is someone with a row on the meeting being
 * edited who has since left the team: their history stays correctable.
 */
export type MeetingRosterPerson = AttendancePerson & { type: TeamMembershipType | 'removed' }

/**
 * The meeting drawer's form, for registering and editing alike.
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

/** An existing meeting's date, text, statuses and reasons, ready to edit. */
export function meetingFormFromMeeting(meeting: AttendanceMeeting): MeetingForm {
  const statuses: MeetingForm['statuses'] = {}
  const reasons: MeetingForm['reasons'] = {}

  for (const entry of meeting.attendances) {
    statuses[entry.userId] = entry.status

    if (entry.status === 'justified') {
      reasons[entry.userId] = entry.justificationReason ?? ''
    }
  }

  return {
    heldOn: meeting.heldOn,
    title: meeting.title ?? '',
    description: meeting.description ?? '',
    statuses,
    reasons,
  }
}

/**
 * Who the edit drawer lists: the meeting's own rows, in the order the API sent
 * them, never the current roster. Someone who joined later has no row and
 * isn't listed (the API would refuse them); someone removed since is, with the
 * type `removed`. The current roster only supplies each person's type.
 */
export function meetingRoster(
  meeting: AttendanceMeeting,
  roster: AttendanceRosterMember[]
): MeetingRosterPerson[] {
  const typeByUser = new Map(roster.map((member) => [member.userId, member.type]))

  return meeting.attendances.map((entry) => ({
    userId: entry.userId,
    name: entry.name,
    nickname: entry.nickname,
    pictureUrl: entry.pictureUrl,
    type: typeByUser.get(entry.userId) ?? 'removed',
  }))
}

export function rowStatus(form: MeetingForm, userId: string): MeetingAttendanceStatus {
  return form.statuses[userId] ?? 'absent'
}

export function rowReason(form: MeetingForm, userId: string): string {
  return form.reasons[userId] ?? ''
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

export function filterRoster(roster: MeetingRosterPerson[], search: string): MeetingRosterPerson[] {
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

export function groupRoster(roster: MeetingRosterPerson[]) {
  return {
    coordinators: roster.filter((member) => member.type === 'coordinator'),
    members: roster.filter((member) => member.type === 'member'),
    removed: roster.filter((member) => member.type === 'removed'),
  }
}

export type AttendanceTally = Record<MeetingAttendanceStatus, number>

/** The footer's `N presentes · N ausentes · N justificadas`, over the whole roster. */
export function tallyAttendance(form: MeetingForm, roster: MeetingRosterPerson[]): AttendanceTally {
  const tally: AttendanceTally = { present: 0, absent: 0, justified: 0 }

  for (const member of roster) {
    tally[rowStatus(form, member.userId)] += 1
  }

  return tally
}

function heldOnError(heldOn: string, today: string): string | undefined {
  if (!heldOn) {
    return 'Informe a data da reunião.'
  }

  if (heldOn > today) {
    return 'A data da reunião não pode ser no futuro.'
  }

  return undefined
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
 * express the one, and `toMeetingBody` never sends the other.
 *
 * `today` is the São Paulo day, `YYYY-MM-DD`; days compare as strings.
 */
export function validateMeetingForm(
  form: MeetingForm,
  roster: MeetingRosterPerson[],
  today: string
): MeetingFormValidation {
  const reasons: Record<string, string> = {}

  for (const member of roster) {
    const isJustified = rowStatus(form, member.userId) === 'justified'

    if (isJustified && !rowReason(form, member.userId).trim()) {
      reasons[member.userId] = 'Informe a justificativa.'
    }
  }

  const heldOn = heldOnError(form.heldOn, today)
  const isValid = heldOn === undefined && Object.keys(reasons).length === 0

  return heldOn === undefined ? { isValid, reasons } : { isValid, heldOn, reasons }
}

/**
 * The `POST /attendance/meetings` (or `PUT …/:id`) body. Only the drawer's
 * roster is read, so a status left on someone outside it is never sent.
 */
export function toMeetingBody(
  form: MeetingForm,
  roster: MeetingRosterPerson[]
): RegisterMeetingBody {
  const presentUserIds: string[] = []
  const justified: RegisterMeetingBody['justified'] = []

  for (const member of roster) {
    const status = rowStatus(form, member.userId)

    if (status === 'present') {
      presentUserIds.push(member.userId)
    } else if (status === 'justified') {
      justified.push({ userId: member.userId, reason: rowReason(form, member.userId).trim() })
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
