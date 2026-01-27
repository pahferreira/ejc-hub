import { EventSubscription } from '../../pages/EventSubscription'
import { EventSubscriptionsList } from '../../pages/EventSubscriptionsList'
import { SubscriptionPermissions } from '../../../../common/permissions'

export const routes = [
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    component: EventSubscriptionsList,
    permission: SubscriptionPermissions.Read,
  },
  {
    path: '/subscriptions/new',
    name: 'Subscribe',
    component: EventSubscription,
    permission: SubscriptionPermissions.Create,
  },
]
