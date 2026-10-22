import { z } from 'zod/v4'

/**
 * Registering a meeting.
 *
 * No `teamInstanceId`: the coordinator's team is derived from their own
 * membership. Shape only — the future date, overlap, roster and blank-reason
 * rules need the roster and São Paulo's today, so `Attendance` owns them.
 */
export const registerMeetingBodySchema = z.object({
  heldOn: z.iso.date(),
  title: z.string().optional(),
  description: z.string().optional(),
  presentUserIds: z.array(z.uuid()),
  justified: z.array(z.object({ userId: z.uuid(), reason: z.string() })),
})

export const meetingParamsSchema = z.object({
  meetingId: z.uuid(),
})

/**
 * Editing a meeting: the same body as registering. Which ids may be listed —
 * the meeting's existing rows only — needs the rows, so `Attendance` owns it.
 */
export const updateMeetingBodySchema = registerMeetingBodySchema
