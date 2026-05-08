import { type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SyncedUser } from '../../../services/users/users.types'
import {
  eventSubscriptionSchema,
  type EventSubscriptionFormInput,
  type EventSubscriptionFormOutput,
} from './eventSubscription.schema'
import { syncedUserToFormDefaults } from './syncedUserToFormDefaults'

export function EventSubscriptionProvider(props: { children: ReactNode; initialUser: SyncedUser }) {
  const form = useForm<EventSubscriptionFormInput, unknown, EventSubscriptionFormOutput>({
    resolver: zodResolver(eventSubscriptionSchema),
    defaultValues: syncedUserToFormDefaults(props.initialUser),
  })

  return <FormProvider {...form}>{props.children}</FormProvider>
}
