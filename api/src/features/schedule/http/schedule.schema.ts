import { z } from 'zod/v4'

/**
 * Adding a day. Shape only — whether the date is inside the event and still
 * free needs the event and its days, so `Schedule` owns those rules.
 */
export const createScheduleDayBodySchema = z.object({
  date: z.iso.date(),
})

/**
 * Moving a day to another date. Shape only — the event range, the free date and
 * the moved activities' overlaps are the core's.
 */
export const updateScheduleDayBodySchema = z.object({
  date: z.iso.date(),
})

/**
 * A start on a whole minute. A day move rebuilds each start from its São Paulo
 * clock time (`HH:mm`), so a start with seconds would lose them when its day
 * moves.
 *
 * Checked on the string, not a `Date`: a `Date` drops digits past the
 * millisecond, so `…:00.0009Z` would pass and be trimmed. Offsets are whole
 * minutes, so the clock seconds are the instant's seconds.
 */
const WHOLE_MINUTE_TIME = /T\d{2}:\d{2}(:00(\.0+)?)?(Z|[+-])/

const wholeMinuteInstantSchema = z.iso
  .datetime({ offset: true })
  .regex(WHOLE_MINUTE_TIME, { message: 'Expected a start on a whole minute' })

export const scheduleDayParamsSchema = z.object({
  dayId: z.uuid(),
})

/**
 * An activity's fields, sent whole both when adding and when editing one. The
 * shape is checked here; whether it fits the day (start in range, no overlap,
 * someone responsible, all teams never with picked teams, teams of the event)
 * is the core's.
 */
export const scheduleActivityBodySchema = z.object({
  dayId: z.uuid(),
  title: z.string().trim().min(1),
  plannedStartsAt: wholeMinuteInstantSchema,
  durationMinutes: z.number().int().positive(),
  place: z.string().trim().min(1),
  teamInstanceIds: z.array(z.uuid()).default([]),
  guestName: z.string().trim().min(1).nullish(),
  adminsResponsible: z.boolean().default(false),
  allTeams: z.boolean().default(false),
})

/** Adding an activity. */
export const createScheduleActivityBodySchema = scheduleActivityBodySchema

/** Editing an activity: every field is sent again, teams included. */
export const updateScheduleActivityBodySchema = scheduleActivityBodySchema

export const scheduleActivityParamsSchema = z.object({
  activityId: z.uuid(),
})

/**
 * A control request on an activity's clock: the status the admin's screen
 * shows. Whether it still matches, and whether the move is allowed, is the core's.
 */
const scheduleActivityStatusSchema = z.enum(['planned', 'running', 'done', 'skipped'])

export const scheduleActivityControlBodySchema = z.object({
  expectedStatus: scheduleActivityStatusSchema,
})

/**
 * Correcting an activity live: the status the admin's screen shows, its actual
 * times and its trim, each left out to keep it (a null trim clears it). Shape
 * only: which fields the status allows, start before end, no overlap and
 * sending at least one field are the core's.
 */
export const scheduleActivityLiveBodySchema = z.object({
  expectedStatus: scheduleActivityStatusSchema,
  actualStartedAt: z.iso.datetime({ offset: true }).optional(),
  actualEndedAt: z.iso.datetime({ offset: true }).optional(),
  adjustedDurationMinutes: z.number().int().positive().nullable().optional(),
})
