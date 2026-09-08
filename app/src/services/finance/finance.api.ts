import { api } from '../api'
import type { EventFeeOverview } from './finance.types'

async function getEventFeeOverview() {
  const response = await api.get<{ overview: EventFeeOverview }>(
    '/events/current/event-fee-overview'
  )
  return response.data.overview
}

export const financeApi = {
  getEventFeeOverview,
}
