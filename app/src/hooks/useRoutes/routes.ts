import { EventSubscription } from '../../pages/EventSubscription'
import { EventSubscriptionsList } from '../../pages/EventSubscriptionsList'
import { SubscriptionPermissions } from '../../../../common/permissions'
import { Home } from '../../pages/Home'

type Route = {
  path: string
  name: string
  component: React.ComponentType
  permission?: string
}

export const routes: Route[] = [
  {
    path: '/home',
    name: 'Início',
    component: Home,
  },
  {
    path: '/subscriptions',
    name: 'Inscrições',
    component: EventSubscriptionsList,
    permission: SubscriptionPermissions.Read,
  },
  {
    path: '/subscriptions/new',
    name: 'Inscrever-se',
    component: EventSubscription,
  },
]
