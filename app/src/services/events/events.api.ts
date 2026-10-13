import { api } from '../api'
import type {
  CreateEventSubscriptionPayload,
  CurrentEvent,
  CurrentEventSubscriptionStatus,
  EventSubscriptionMode,
  SubscriptionListFilters,
  SubscriptionListPagination,
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

/**
 * The subscriptions list's query string.
 *
 * Every multi-value filter goes out as one comma-joined parameter. Repeating
 * the parameter instead is what made `teamKeys` silently match every team
 * whenever two or more were selected, so new filters follow this shape rather
 * than appending. An empty selection omits its parameter entirely, which keeps
 * it out of the React Query key too.
 */
export function toSubscriptionListParams(
  filters: SubscriptionListFilters = {},
  pagination: SubscriptionListPagination = {}
) {
  const params = new URLSearchParams()

  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.teamKeys?.length) {
    params.set('teamKeys', filters.teamKeys.join(','))
  }

  if (filters.status?.length) {
    params.set('status', filters.status.join(','))
  }

  if (filters.skills?.length) {
    params.set('skills', filters.skills.join(','))
  }

  if (filters.experience?.length) {
    params.set('experience', filters.experience.join(','))
  }

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page))
  }

  if (pagination.pageSize !== undefined) {
    params.set('pageSize', String(pagination.pageSize))
  }

  return params
}

async function getCurrentEventSubscriptionsList(
  filters: SubscriptionListFilters = {},
  pagination: SubscriptionListPagination = {}
) {
  const response = await api.get<SubscriptionListResponse>('/events/current/subscriptions', {
    params: toSubscriptionListParams(filters, pagination),
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

async function setEventSubscriptionMode(eventId: string, mode: EventSubscriptionMode) {
  const response = await api.patch<{ event: CurrentEvent }>(
    `/control-panel/events/${eventId}/subscription-mode`,
    { mode }
  )

  return response.data.event
}

export const eventsApi = {
  createEventSubscription,
  getCurrentEventSubscriptionsList,
  getCurrentEventSubscriptionStats,
  getCurrentEventSubscriptionStatus,
  getCurrentEvent,
  setEventSubscriptionMode,
}
