import { z } from 'zod/v4'

/**
 * Adding a day. Shape only — whether the date is inside the event and still
 * free needs the event and its days, so `Schedule` owns those rules.
 */
export const createScheduleDayBodySchema = z.object({
  date: z.iso.date(),
})

export const scheduleDayParamsSchema = z.object({
  dayId: z.uuid(),
})

/**
 * An activity's fields, sent whole both when adding and when editing one. The
 * shape is checked here; whether it fits the day (start in range, no overlap,
 * someone responsible, teams of the event) is the core's.
 */
export const scheduleActivityBodySchema = z.object({
  dayId: z.uuid(),
  title: z.string().trim().min(1),
  plannedStartsAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().positive(),
  place: z.string().trim().min(1),
  teamInstanceIds: z.array(z.uuid()).default([]),
  guestName: z.string().trim().min(1).nullish(),
  adminsResponsible: z.boolean().default(false),
})

/** Adding an activity. */
export const createScheduleActivityBodySchema = scheduleActivityBodySchema

/** Editing an activity: every field is sent again, teams included. */
export const updateScheduleActivityBodySchema = scheduleActivityBodySchema

export const scheduleActivityParamsSchema = z.object({
  activityId: z.uuid(),
})
