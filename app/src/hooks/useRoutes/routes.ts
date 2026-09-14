import { EventSubscription } from '../../pages/EventSubscription'
import { EventSubscriptionsList } from '../../pages/EventSubscriptionsList'
import {
  EventFeePermissions,
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
import { EventFeePage } from '../../pages/EventFeePage'
import { EventFeeMembersPage } from '../../pages/EventFeeMembersPage'
import { CoordinatorEventFeePage } from '../../pages/CoordinatorEventFeePage'
import { Placeholder } from '../../pages/Placeholder/Placeholder'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { FeatureFlag, type FeatureFlagValue } from '../useFeatureFlag/feature-flags'

type Route = {
  path: string
  name: string
  component: React.ComponentType
  permission?: string
  /**
   * Only accessible when this feature flag is enabled. Not a permission, so
   * it's filtered against the feature-flag state.
   */
  featureFlag?: FeatureFlagValue
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
    featureFlag: FeatureFlag.MyTeam,
  },
  {
    path: ROUTE_PATHS.MY_TEAM_FEE,
    name: 'Taxa de Inscrição',
    component: CoordinatorEventFeePage,
    // No permission and no membership filter, matching how `MY_TEAM` is
    // registered: whether the caller coordinates a team is data the route table
    // cannot know without waiting on a request, and filtering the route out
    // while that request is in flight would answer a coordinator's own bookmark
    // with "página não encontrada". The page itself holds the check, which is
    // the only place that can tell "still loading" from "not a coordinator".
    featureFlag: FeatureFlag.CoordinatorEventFee,
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
  {
    path: ROUTE_PATHS.EVENT_FEE,
    name: 'Taxa por Equipe',
    component: EventFeePage,
    permission: EventFeePermissions.Read,
    featureFlag: FeatureFlag.EventFee,
  },
  {
    path: ROUTE_PATHS.EVENT_FEE_MEMBERS,
    name: 'Taxa por Membro',
    component: EventFeeMembersPage,
    // Read access only. Confirming is gated separately, inside the page, on
    // `financials-event-fee:update` — a treasurer's assistant may legitimately
    // see who owes without being able to settle it.
    permission: EventFeePermissions.Read,
    featureFlag: FeatureFlag.EventFee,
  },
  {
    path: ROUTE_PATHS.SHIRTS,
    name: 'Camisetas',
    component: Placeholder,
    featureFlag: FeatureFlag.Shirts,
  },
]
