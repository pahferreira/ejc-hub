import { z } from 'zod'

export const eventSubscriptionSchema = z.object({
  fullName: z.string().nonempty('Nome completo é obrigatório'),
  nickname: z.string().nonempty('Apelido é obrigatório'),
  email: z.email('Email inválido'),
  phone: z.string().nonempty('Telefone é obrigatório'),
  emergencyContactName: z.string().nonempty('Nome do contato de emergência é obrigatório'),
  emergencyContactPhone: z.string().nonempty('Telefone do contato de emergência é obrigatório'),
  hasPreviousExperience: z.enum(['yes', 'no']),
  hasCoordinatorExperience: z.enum(['yes', 'no']),
  selectedSkills: z.array(z.string()).optional(),
  selectedTeams: z.array(z.string()).min(3, 'Selecione pelo menos 3 equipes.'),
  selectedAvailability: z.array(z.string()).min(1, 'Selecione pelo menos 1 dia de disponibilidade'),
  details: z.string().optional(),
  selectedPreviousExperienceTeams: z.array(z.string()).optional(),
})

export type EventSubscriptionFormData = z.infer<typeof eventSubscriptionSchema>
