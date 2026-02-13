import { useController, useFormContext } from 'react-hook-form'
import type { EventSubscriptionFormData } from './EventSubscriptionContext'

export function useEventSubscriptionForm() {
  return useFormContext<EventSubscriptionFormData>()
}

export function useEventSubscriptionField<K extends keyof EventSubscriptionFormData>(name: K) {
  const { control } = useFormContext<EventSubscriptionFormData>()
  return useController({ control, name })
}
