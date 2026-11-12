import { z } from 'zod'
import { hasSomeoneResponsible } from './scheduleActivity'

const TIME_PATTERN = /^\d{1,2}:\d{2}$/

const responsibleSchema = z.object({
  teamInstanceIds: z.array(z.string()),
  guestName: z.string(),
  adminsResponsible: z.boolean(),
  /** Every team of the event. The form clears `teamInstanceIds` when it's checked. */
  allTeams: z.boolean(),
})

/**
 * The shape checks the inline "NOVA ATIVIDADE" form runs before it submits,
 * plus "someone responsible" (a team, all teams, a guest or the admins), mirroring the
 * API. Planning rules that need the day's other activities (overlaps…) stay on
 * the API.
 *
 * The responsible error lands on `teamInstanceIds`, the first field of the
 * responsible box.
 */
export const scheduleActivityFormSchema = z
  .object({
    title: z.string().refine((title) => title.trim() !== '', 'Informe um título'),
    /** `HH:mm` on the São Paulo clock. */
    startTime: z.string().regex(TIME_PATTERN, 'Informe um horário'),
    durationMinutes: z.number({ error: 'Informe uma duração' }).positive('Informe uma duração'),
    place: z.string().refine((place) => place.trim() !== '', 'Informe o local'),
    ...responsibleSchema.shape,
  })
  .refine(
    (values) =>
      hasSomeoneResponsible({
        teamCount: values.teamInstanceIds.length,
        allTeams: values.allTeams,
        guestName: values.guestName,
        adminsResponsible: values.adminsResponsible,
      }),
    {
      message: 'Escolha ao menos um responsável',
      path: ['teamInstanceIds'],
      // Zod skips object refinements while any field is invalid; run this one
      // as long as the responsible fields themselves parse, so it shows up
      // alongside the other field errors.
      when: (payload) => responsibleSchema.safeParse(payload.value).success,
    }
  )

/** What the inline "NOVA ATIVIDADE" form holds before it becomes a request. */
export type ScheduleActivityFormValues = z.infer<typeof scheduleActivityFormSchema>
