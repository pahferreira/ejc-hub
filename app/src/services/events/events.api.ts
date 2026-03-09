import { api } from '../api'
import type { CreateEventSubscriptionPayload, SubscriptionWithDetails } from './events.types'

function createEventSubscription(payload: CreateEventSubscriptionPayload) {
  return api.post('/events/current', payload)
}

async function getCurrentEventSubscriptionsList() {
  const response = await api.get<{ subscriptions: SubscriptionWithDetails[] }>(
    '/events/current/subscriptions'
  )

  return response.data.subscriptions
}

export const eventsApi = {
  createEventSubscription,
  getCurrentEventSubscriptionsList,
}
