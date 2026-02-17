import { type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export const eventSubscriptionSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
  hasPreviousExperience: z.enum(['yes', 'no']),
  selectedSkills: z.array(z.string()),
  selectedTeams: z.array(z.string()),
})

export type EventSubscriptionFormData = z.infer<typeof eventSubscriptionSchema>

export function EventSubscriptionProvider(props: { children: ReactNode }) {
  const form = useForm<EventSubscriptionFormData>({
    resolver: zodResolver(eventSubscriptionSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      hasPreviousExperience: 'no',
      selectedSkills: [],
      selectedTeams: [],
    },
  })

  return <FormProvider {...form}>{props.children}</FormProvider>
}
