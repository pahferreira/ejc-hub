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
