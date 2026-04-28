import { api } from '../api'
import type {
  CreateEventSubscriptionPayload,
  CurrentEventSubscriptionStatus,
  SubscriptionWithDetails,
} from './events.types'
import { errorMessage, type ApiError } from '../general/error'
import { isAxiosError } from 'axios'

async function createEventSubscription(payload: CreateEventSubscriptionPayload) {
  try {
    const response = await api.post('/events/current', payload)
    return response
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      const apiError = error as ApiError
      const errorCode = apiError.response.data?.code
      const appErrorMessage = errorCode
        ? (errorMessage[errorCode] ?? apiError.response.data.message)
        : 'Error ao criar inscrição para o evento'

      throw new Error(appErrorMessage)
    }
    throw new Error('Error ao criar inscrição para o evento')
  }
}

async function getCurrentEventSubscriptionsList() {
  const response = await api.get<{ subscriptions: SubscriptionWithDetails[] }>(
    '/events/current/subscriptions'
  )

  return response.data.subscriptions
}

async function getCurrentEventSubscriptionStatus() {
  const response = await api.get<CurrentEventSubscriptionStatus>('/events/current/subscription/me')

  return response.data
}

export const eventsApi = {
  createEventSubscription,
  getCurrentEventSubscriptionsList,
  getCurrentEventSubscriptionStatus,
}
