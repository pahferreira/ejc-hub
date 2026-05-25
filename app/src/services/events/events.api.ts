import { api } from '../api'
import type {
  CreateEventSubscriptionPayload,
  CurrentEvent,
  CurrentEventSubscriptionStatus,
  SubscriptionListFilters,
  SubscriptionListResponse,
  SubscriptionStatsResponse,
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

async function getCurrentEventSubscriptionsList(filters: SubscriptionListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.teamKeys) {
    for (const key of filters.teamKeys) {
      params.append('teamKeys', key)
    }
  }

  if (filters.status) {
    for (const s of filters.status) {
      params.append('status', s)
    }
  }

  const response = await api.get<SubscriptionListResponse>('/events/current/subscriptions', {
    params,
  })

  return response.data
}

async function getCurrentEventSubscriptionStats() {
  const response = await api.get<SubscriptionStatsResponse>('/events/current/subscriptions/stats')

  return response.data
}

async function getCurrentEventSubscriptionStatus() {
  const response = await api.get<CurrentEventSubscriptionStatus>('/events/current/subscription/me')

  return response.data
}

async function getCurrentEvent() {
  const response = await api.get<{ currentEvent: CurrentEvent }>('/events/current')

  return response.data.currentEvent
}

export const eventsApi = {
  createEventSubscription,
  getCurrentEventSubscriptionsList,
  getCurrentEventSubscriptionStats,
  getCurrentEventSubscriptionStatus,
  getCurrentEvent,
}
