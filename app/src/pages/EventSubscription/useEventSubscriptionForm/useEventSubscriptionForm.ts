import { useController, useFormContext } from 'react-hook-form'
import type { EventSubscriptionFormInput } from './eventSubscription.schema'

export function useEventSubscriptionForm() {
  return useFormContext<EventSubscriptionFormInput>()
}

export function useEventSubscriptionField<K extends keyof EventSubscriptionFormInput>(name: K) {
  const { control } = useFormContext<EventSubscriptionFormInput>()
  return useController({ control, name })
}
