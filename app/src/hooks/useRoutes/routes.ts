import { EventSubscription } from '../../pages/EventSubscription'
import { EventSubscriptionsList } from '../../pages/EventSubscriptionsList'
import {
  EventPermissions,
  SubscriptionPermissions,
  TeamInstancePermissions,
  TeamTemplatePermissions,
} from '../../../../common/permissions'
import { Home } from '../../pages/Home'
import { TeamsPage } from '../../pages/TeamsPage'
import { TeamBuildingPage } from '../../pages/TeamBuildingPage'
import { TeamDetailPage } from '../../pages/TeamDetailPage'
import { MyTeamPage } from '../../pages/MyTeamPage'
import { Placeholder } from '../../pages/Placeholder/Placeholder'
import { ROUTE_PATHS } from '../../constants/routePaths'

type Route = {
  path: string
  name: string
  component: React.ComponentType
  permission?: string
  /**
   * Only accessible when the `current-event-my-team` feature flag is enabled.
   * Not a permission, so it's filtered against the feature-flag state.
   */
  requiresMyTeamFlag?: boolean
}

export const routes: Route[] = [
  {
    path: ROUTE_PATHS.HOME,
    name: 'Início',
    component: Home,
  },
  {
    path: ROUTE_PATHS.MY_TEAM,
    name: 'Minha Equipe',
    component: MyTeamPage,
    requiresMyTeamFlag: true,
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
    component: TeamsPage,
    permission: TeamInstancePermissions.Read,
  },
  {
    path: ROUTE_PATHS.TEAMS_TEAM_BUILDING,
    name: 'Montagem',
    component: TeamBuildingPage,
    permission: TeamInstancePermissions.Read,
  },
  {
    path: ROUTE_PATHS.TEAM_DETAIL,
    name: 'Detalhe da Equipe',
    component: TeamDetailPage,
    permission: TeamInstancePermissions.Read,
  },
  {
    path: ROUTE_PATHS.TEAM_TEMPLATES,
    name: 'Templates',
    component: Placeholder,
    permission: TeamTemplatePermissions.Read,
  },
]
