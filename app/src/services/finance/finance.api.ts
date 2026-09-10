import { api } from '../api'
import type {
  EventFeeMemberFilters,
  EventFeeMemberListResponse,
  EventFeeMemberPagination,
  EventFeeOverview,
} from './finance.types'

async function getEventFeeOverview() {
  const response = await api.get<{ overview: EventFeeOverview }>(
    '/events/current/event-fee-overview'
  )
  return response.data.overview
}

async function getEventFeeMembers(
  filters: EventFeeMemberFilters = {},
  pagination: EventFeeMemberPagination = {}
) {
  const params = new URLSearchParams()

  // Each key is set only when it carries a value: the API drops a blank `name`
  // anyway, but sending `name=` would put an extra entry in the React Query key
  // and refetch for nothing.
  if (filters.name) {
    params.set('name', filters.name)
  }

  if (filters.teamKey) {
    params.set('teamKey', filters.teamKey)
  }

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (pagination.page !== undefined) {
    params.set('page', String(pagination.page))
  }

  if (pagination.pageSize !== undefined) {
    params.set('pageSize', String(pagination.pageSize))
  }

  const response = await api.get<EventFeeMemberListResponse>('/events/current/event-fee-members', {
    params,
  })

  return response.data
}

/**
 * Marks every given member's fee as paid in the current event.
 *
 * Always the batch route, even for a single row. The one-member route exists and
 * does the same thing, but two call paths for one action means two places to
 * keep the error handling and cache invalidation in step — and the API's batch
 * handler is a one-item list away from the single handler anyway.
 */
async function confirmEventFeePayments(userIds: string[]) {
  const response = await api.put<{ result: { updatedUserIds: string[]; updatedCount: number } }>(
    '/financial/event-fee/admin/payments/status',
    { userIds, status: 'paid' }
  )

  return response.data.result
}

export const financeApi = {
  getEventFeeOverview,
  getEventFeeMembers,
  confirmEventFeePayments,
}
