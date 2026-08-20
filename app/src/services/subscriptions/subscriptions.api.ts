import { api } from '../api'

function confirmSubscription(subscriptionId: string) {
  return api.post(`/subscriptions/${subscriptionId}/confirm`)
}

function waitListSubscription(subscriptionId: string) {
  return api.post(`/subscriptions/${subscriptionId}/wait-list`)
}

function cancelSubscription(subscriptionId: string) {
  return api.post(`/subscriptions/${subscriptionId}/cancel`)
}

export const subscriptionsApi = {
  confirmSubscription,
  waitListSubscription,
  cancelSubscription,
}
