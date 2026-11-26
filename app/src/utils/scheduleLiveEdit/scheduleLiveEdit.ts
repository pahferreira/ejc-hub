import { toEventDate } from '../../../../common/schedule/toEventDate'
import { toEventInstant } from '../../../../common/schedule/toEventInstant'
import { toEventTime } from '../../../../common/schedule/toEventTime'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
  UpdateScheduleActivityLiveBody,
} from '../../services/schedule/schedule.types'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** Which parts of the live-edit form an activity shows, from its status. */
export type LiveEditFields = {
  /** "Duração ajustada": a planned or running activity. */
  trim: boolean
  /** The actual start: a running or done activity. */
  start: boolean
  /** The actual end: a done activity. */
  end: boolean
}

/** The live-edit form's parts for a status. A skipped activity has none. */
export function liveEditFields(status: ScheduleActivityStatus): LiveEditFields {
  return {
    trim: status === 'planned' || status === 'running',
    start: status === 'running' || status === 'done',
    end: status === 'done',
  }
}

/** Whether an activity has anything to correct live: every status but skipped. */
export function canEditLive(status: ScheduleActivityStatus): boolean {
  const fields = liveEditFields(status)
  return fields.trim || fields.start || fields.end
}

/** The live-edit form's values, as text the inputs hold. */
export type LiveEditFormValues = {
  /** Minutes, or empty for no trim. */
  adjustedDuration: string
  /** `HH:mm` on the São Paulo clock, or empty when the activity has none. */
  startTime: string
  endTime: string
}

export type LiveEditFieldErrors = Partial<Record<keyof LiveEditFormValues, string>>

function eventTime(instant: string | null): string {
  return instant ? toEventTime(new Date(instant)) : ''
}

/** The form's values, pre-filled from the activity it edits. */
export function liveEditFormValues(
  activity: Pick<ScheduleActivity, 'adjustedDurationMinutes' | 'actualStartedAt' | 'actualEndedAt'>
): LiveEditFormValues {
  return {
    adjustedDuration:
      activity.adjustedDurationMinutes === null ? '' : String(activity.adjustedDurationMinutes),
    startTime: eventTime(activity.actualStartedAt),
    endTime: eventTime(activity.actualEndedAt),
  }
}

/**
 * The shape checks the form runs before it submits, on the parts it shows: a
 * trim is empty or a whole number of minutes above zero, and each actual time
 * is an `HH:mm`. Start before end and overlaps stay on the API.
 */
export function validateLiveEdit(
  values: LiveEditFormValues,
  fields: LiveEditFields
): LiveEditFieldErrors {
  const errors: LiveEditFieldErrors = {}
  const trim = values.adjustedDuration.trim()

  if (fields.trim && trim !== '' && !(Number.isInteger(Number(trim)) && Number(trim) > 0)) {
    errors.adjustedDuration = 'Informe uma duração maior que zero'
  }

  if (fields.start && !TIME_PATTERN.test(values.startTime)) {
    errors.startTime = 'Informe um horário'
  }

  if (fields.end && !TIME_PATTERN.test(values.endTime)) {
    errors.endTime = 'Informe um horário'
  }

  return errors
}

/**
 * An `HH:mm` moved onto the São Paulo date of the instant it corrects, so a
 * past-midnight time stays on its own date.
 */
function correctedInstant(instant: string, time: string): string {
  return toEventInstant(toEventDate(new Date(instant)), time).toISOString()
}

/**
 * The request body for the fields the admin changed, or null when nothing
 * changed. A field left as it was isn't sent, so a running start keeps its
 * seconds. An emptied trim is sent as null to clear it.
 */
export function buildLiveEditBody(
  activity: Pick<
    ScheduleActivity,
    'status' | 'adjustedDurationMinutes' | 'actualStartedAt' | 'actualEndedAt'
  >,
  values: LiveEditFormValues
): UpdateScheduleActivityLiveBody | null {
  const fields = liveEditFields(activity.status)
  const initial = liveEditFormValues(activity)
  const body: UpdateScheduleActivityLiveBody = { expectedStatus: activity.status }
  const trim = values.adjustedDuration.trim()

  if (fields.trim && trim !== initial.adjustedDuration) {
    body.adjustedDurationMinutes = trim === '' ? null : Number(trim)
  }

  if (fields.start && activity.actualStartedAt && values.startTime !== initial.startTime) {
    body.actualStartedAt = correctedInstant(activity.actualStartedAt, values.startTime)
  }

  if (fields.end && activity.actualEndedAt && values.endTime !== initial.endTime) {
    body.actualEndedAt = correctedInstant(activity.actualEndedAt, values.endTime)
  }

  return Object.keys(body).length > 1 ? body : null
}
