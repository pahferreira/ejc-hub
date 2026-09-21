export const EventSubscriptionMode = {
  Open: 'open',
  WaitingList: 'waiting_list',
  Closed: 'closed',
} as const

export type EventSubscriptionMode =
  (typeof EventSubscriptionMode)[keyof typeof EventSubscriptionMode]

export const EVENT_SUBSCRIPTION_MODES = [
  EventSubscriptionMode.Open,
  EventSubscriptionMode.WaitingList,
  EventSubscriptionMode.Closed,
] as const
