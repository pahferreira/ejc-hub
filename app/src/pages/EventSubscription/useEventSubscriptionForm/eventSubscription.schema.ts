import { z } from 'zod'
import type { CreateEventSubscriptionPayload } from '../../../services/events/events.types'

export const eventSubscriptionSchema = z
  .object({
    fullName: z.string().nonempty('Nome completo é obrigatório'),
    nickname: z.string().nonempty('Apelido é obrigatório'),
    email: z.email('Email inválido'),
    phone: z.string().nonempty('Telefone é obrigatório'),
    emergencyContactName: z.string().nonempty('Nome do contato de emergência é obrigatório'),
    emergencyContactPhone: z.string().nonempty('Telefone do contato de emergência é obrigatório'),
    experienceType: z.enum(['newbie', 'experienced', 'experienced_outsider']),
    circle: z.enum(['red', 'green', 'blue']).optional(),
    hasCoordinatorExperience: z.boolean(),
    selectedSkills: z.array(z.string()).optional(),
    selectedTeams: z.array(z.string()).min(3, 'Selecione pelo menos 3 equipes.'),
    selectedAvailability: z
      .array(z.string())
      .min(1, 'Selecione pelo menos 1 dia de disponibilidade'),
    details: z.string().optional(),
    selectedPreviousExperienceTeams: z.array(z.string()).optional(),
  })
  .refine((data) => !(data.experienceType === 'newbie' && !data.circle), {
    message: 'Selecione o círculo que você participou',
    path: ['circle'],
  })
  .transform((data) => ({
    fullName: data.fullName,
    nickname: data.nickname,
    email: data.email,
    phone: data.phone,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    experienceType: data.experienceType,
    circle: data.experienceType === 'newbie' ? data.circle : undefined,
    hasCoordinatorExperience: data.hasCoordinatorExperience,
    selectedSkills: data.selectedSkills ?? [],
    selectedTeams: data.selectedTeams,
    details: data.details,
    availability: data.selectedAvailability,
    previousExperienceTeams:
      data.experienceType === 'newbie' ? [] : (data.selectedPreviousExperienceTeams ?? []),
  }))

export type EventSubscriptionFormInput = z.input<typeof eventSubscriptionSchema>
export type EventSubscriptionFormOutput = z.output<typeof eventSubscriptionSchema>

// Type-level assertion: EventSubscriptionFormOutput must be structurally assignable to CreateEventSubscriptionPayload
type _AssertOutputMatchesPayload =
  EventSubscriptionFormOutput extends CreateEventSubscriptionPayload ? true : never
const _check: _AssertOutputMatchesPayload = true
void _check

// Backward-compatibility alias
export type EventSubscriptionFormData = EventSubscriptionFormInput
