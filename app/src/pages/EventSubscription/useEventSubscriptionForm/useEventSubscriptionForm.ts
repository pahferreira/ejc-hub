import { useController, useFormContext } from 'react-hook-form'
import type {
  EventSubscriptionFormInput,
  EventSubscriptionFormOutput,
} from './eventSubscription.schema'

// The three generics must match the provider's useForm call — with only the
// input type, handleSubmit would type the submit data as the pre-transform
// (input) shape instead of EventSubscriptionFormOutput.
export function useEventSubscriptionForm() {
  return useFormContext<EventSubscriptionFormInput, unknown, EventSubscriptionFormOutput>()
}

export function useEventSubscriptionField<K extends keyof EventSubscriptionFormInput>(name: K) {
  const { control } = useFormContext<
    EventSubscriptionFormInput,
    unknown,
    EventSubscriptionFormOutput
  >()
  return useController({ control, name })
}
