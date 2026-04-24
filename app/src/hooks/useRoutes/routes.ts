import { EventSubscription } from '../../pages/EventSubscription'
import { EventSubscriptionsList } from '../../pages/EventSubscriptionsList'
import {
  EventPermissions,
  SubscriptionPermissions,
  TeamTemplatePermissions,
} from '../../../../common/permissions'
import { Home } from '../../pages/Home'
import { Placeholder } from '../../pages/Placeholder/Placeholder'
import { ROUTE_PATHS } from '../../constants/routePaths'

type Route = {
  path: string
  name: string
  component: React.ComponentType
  permission?: string
}

export const routes: Route[] = [
  {
    path: ROUTE_PATHS.HOME,
    name: 'Início',
    component: Home,
  },
  {
    path: ROUTE_PATHS.SUBSCRIPTIONS,
    name: 'Inscrições',
    component: EventSubscriptionsList,
    permission: SubscriptionPermissions.Read,
  },
  {
    path: ROUTE_PATHS.SUBSCRIPTIONS_NEW,
    name: 'Inscrever-se',
    component: EventSubscription,
  },
  {
    path: ROUTE_PATHS.EVENTS,
    name: 'Eventos',
    component: Placeholder,
    permission: EventPermissions.Read,
  },
  {
    path: ROUTE_PATHS.TEAMS,
    name: 'Equipes',
    component: Placeholder,
    permission: SubscriptionPermissions.Read,
  },
  {
    path: ROUTE_PATHS.TEAM_TEMPLATES,
    name: 'Templates',
    component: Placeholder,
    permission: TeamTemplatePermissions.Read,
  },
]
