import { api } from '../api'

function confirmSubscription(subscriptionId: string) {
  return api.post(`/subscriptions/${subscriptionId}/confirm`)
}

function waitListSubscription(subscriptionId: string) {
  return api.post(`/subscriptions/${subscriptionId}/wait-list`)
}

export const subscriptionsApi = {
  confirmSubscription,
  waitListSubscription,
}
