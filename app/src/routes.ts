import { EventSubscription } from './pages/EventSubscription'
import { EventSubscriptionsList } from './pages/EventSubscriptionsList'

export const routes = [
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    component: EventSubscriptionsList,
  },
  {
    path: '/subscriptions/new',
    name: 'Subscribe',
    component: EventSubscription,
  },
]
