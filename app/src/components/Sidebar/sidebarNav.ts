import type { IconType } from 'react-icons'
import {
  FiHome,
  FiList,
  FiUsers,
  FiCalendar,
  FiLayers,
  FiUser,
  FiDollarSign,
  FiShoppingBag,
  FiUserCheck,
  FiGrid,
  FiUserPlus,
  FiInbox,
  FiClock,
} from 'react-icons/fi'
import {
  EventFeePermissions,
  EventPermissions,
  MemberRequestPermissions,
  SchedulePermissions,
  SubscriptionPermissions,
  TeamInstancePermissions,
  TeamTemplatePermissions,
} from '../../../../common/permissions'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { FeatureFlag, type FeatureFlagValue } from '../../hooks/useFeatureFlag/feature-flags'
import {
  coordinators,
  teamMembers,
  teamMembersOrWithPermission,
  withPermission,
  type NavAccessRule,
} from './sidebarAccess'

export type SidebarNavItem = {
  label: string
  path: string
  icon: IconType
  /**
   * Who may see it, from `sidebarAccess`: a permission, a current-event
   * membership, or both combined. Leave unset for everyone.
   */
  visibleTo?: NavAccessRule
  /**
   * Only shown when this feature flag is enabled. Not a permission, so it's
   * filtered at render time against the feature-flag state.
   */
  featureFlag?: FeatureFlagValue
  /**
   * Like `featureFlag`, but the flag depends on the caller's membership type:
   * one page whose coordinator and member views roll out separately.
   */
  featureFlagByMembership?: { coordinator: FeatureFlagValue; member: FeatureFlagValue }
  /**
   * Highlights only on an exact path match. Needed when another nav item sits
   * below this one's path (`/financial/event-fee` vs `/financial/event-fee/members`),
   * since `NavLink` otherwise treats the ancestor as active too and both light up.
   * Leave unset for items whose sub-routes have no nav entry of their own — the
   * default prefix match is what keeps "Equipes" lit on `/teams/:teamKey`.
   */
  end?: boolean
}

export type SidebarNavGroup = {
  title: string
  items: SidebarNavItem[]
}

export const sidebarNavGroups: SidebarNavGroup[] = [
  {
    title: 'PRINCIPAL',
    items: [
      {
        label: 'Início',
        path: ROUTE_PATHS.HOME,
        icon: FiHome,
      },
      {
        label: 'Cronograma',
        path: ROUTE_PATHS.SCHEDULE,
        icon: FiClock,
        visibleTo: teamMembersOrWithPermission(SchedulePermissions.Read),
        featureFlag: FeatureFlag.Schedule,
        // `SCHEDULE_PLANNING` sits below this path and has a nav entry of its own.
        end: true,
      },
    ],
  },
  {
    title: 'ENCONTRO',
    items: [
      {
        label: 'Inscrições',
        path: ROUTE_PATHS.SUBSCRIPTIONS,
        icon: FiList,
        visibleTo: withPermission(SubscriptionPermissions.Read),
      },
      {
        label: 'Equipes',
        path: ROUTE_PATHS.TEAMS,
        icon: FiUsers,
        visibleTo: withPermission(TeamInstancePermissions.Read),
      },
      {
        label: 'Montagem',
        path: ROUTE_PATHS.TEAMS_TEAM_BUILDING,
        icon: FiGrid,
        visibleTo: withPermission(TeamInstancePermissions.Read),
      },
      {
        // "Aprovar Solicitações", not the page's own H1 "Solicitações de
        // Membros": an admin who also coordinates a team sees this beside
        // "Solicitar Membros", and the two would sit one letter apart. Two
        // verbs, no confusion (plan D7).
        label: 'Aprovar Solicitações',
        path: ROUTE_PATHS.MEMBER_REQUESTS,
        icon: FiInbox,
        visibleTo: withPermission(MemberRequestPermissions.Read),
        featureFlag: FeatureFlag.AdminMemberRequests,
      },
    ],
  },
  {
    title: 'FINANCEIRO',
    items: [
      {
        label: 'Taxa por Equipe',
        path: ROUTE_PATHS.EVENT_FEE,
        icon: FiDollarSign,
        visibleTo: withPermission(EventFeePermissions.Read),
        end: true,
      },
      {
        label: 'Taxa por Membro',
        path: ROUTE_PATHS.EVENT_FEE_MEMBERS,
        icon: FiUserCheck,
        visibleTo: withPermission(EventFeePermissions.Read),
      },
      {
        label: 'Camisetas',
        path: ROUTE_PATHS.SHIRTS,
        icon: FiShoppingBag,
        featureFlag: FeatureFlag.Shirts,
      },
    ],
  },
  {
    // Its own group rather than an entry under FINANCEIRO: that group is the
    // treasurer's event-wide screens, and this one is a coordinator's own team.
    // The empty-group filter in `Sidebar` drops the whole heading for everyone
    // who is not a coordinator.
    title: 'MINHA EQUIPE',
    items: [
      {
        label: 'Minha Equipe',
        path: ROUTE_PATHS.MY_TEAM,
        icon: FiUser,
        visibleTo: teamMembers,
        // `MY_TEAM_FEE` sits below this path and has a nav entry of its own, so
        // without this both light up while a coordinator is on the fee page.
        end: true,
      },
      {
        label: 'Taxa de Inscrição',
        path: ROUTE_PATHS.MY_TEAM_FEE,
        icon: FiDollarSign,
        visibleTo: coordinators,
      },
      {
        label: 'Solicitar Membros',
        path: ROUTE_PATHS.MY_TEAM_REQUEST_MEMBERS,
        icon: FiUserPlus,
        visibleTo: coordinators,
        featureFlag: FeatureFlag.CoordinatorMemberRequests,
      },
      {
        label: 'Minhas Solicitações',
        path: ROUTE_PATHS.MY_TEAM_MY_REQUESTS,
        icon: FiInbox,
        visibleTo: coordinators,
        featureFlag: FeatureFlag.CoordinatorMemberRequests,
      },
      {
        label: 'Reuniões',
        path: ROUTE_PATHS.MY_TEAM_MEETINGS,
        icon: FiCalendar,
        // Everyone on a team: coordinators get the board, members their own history.
        visibleTo: teamMembers,
        featureFlagByMembership: {
          coordinator: FeatureFlag.CoordinatorAttendance,
          member: FeatureFlag.AttendanceVisibility,
        },
      },
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      {
        label: 'Encontros',
        path: ROUTE_PATHS.EVENTS,
        icon: FiCalendar,
        visibleTo: withPermission(EventPermissions.Read),
      },
      {
        label: 'Modelos de Equipe',
        path: ROUTE_PATHS.TEAM_TEMPLATES,
        icon: FiLayers,
        visibleTo: withPermission(TeamTemplatePermissions.Read),
      },
      {
        label: 'Planejar Cronograma',
        path: ROUTE_PATHS.SCHEDULE_PLANNING,
        icon: FiClock,
        visibleTo: withPermission(SchedulePermissions.Update),
        featureFlag: FeatureFlag.Schedule,
      },
    ],
  },
]
