import { z } from 'zod/v4'

const assignmentTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('team'), teamInstanceId: z.uuid() }),
  z.object({ kind: z.literal('waiting_list') }),
  z.object({ kind: z.literal('unassigned') }),
])

export const applyAssignmentsBodySchema = z.object({
  assignments: z
    .array(
      z.object({
        userId: z.uuid(),
        target: assignmentTargetSchema,
      })
    )
    .min(1, 'at least one assignment is required'),
})

export type ApplyAssignmentsBody = z.infer<typeof applyAssignmentsBodySchema>

export const teamInstanceParamsSchema = z.object({
  teamInstanceId: z.uuid(),
})

export const setCoordinatorsBodySchema = z.object({
  coordinatorIds: z.array(z.uuid()).max(3),
})
