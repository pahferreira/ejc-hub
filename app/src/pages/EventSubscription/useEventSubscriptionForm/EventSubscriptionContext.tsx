import { type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  eventSubscriptionSchema,
  type EventSubscriptionFormInput,
  type EventSubscriptionFormOutput,
} from './eventSubscription.schema'

export function EventSubscriptionProvider(props: { children: ReactNode }) {
  const form = useForm<EventSubscriptionFormInput, unknown, EventSubscriptionFormOutput>({
    resolver: zodResolver(eventSubscriptionSchema),
    defaultValues: {
      fullName: '',
      nickname: '',
      email: '',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      hasPreviousExperience: 'no',
      hasCoordinatorExperience: 'no',
      selectedSkills: [],
      selectedTeams: [],
      selectedAvailability: [],
      details: '',
      selectedPreviousExperienceTeams: [],
    },
  })

  return <FormProvider {...form}>{props.children}</FormProvider>
}
