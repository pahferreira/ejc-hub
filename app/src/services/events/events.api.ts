import { api } from '../api'
import type { CreateEventSubscriptionPayload } from './events.types'

function createEventSubscription(payload: CreateEventSubscriptionPayload) {
  return api.post('/events/current', payload)
}

export const eventsApi = {
  createEventSubscription,
}
