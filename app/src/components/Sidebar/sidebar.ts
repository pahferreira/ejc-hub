import type { IconType } from 'react-icons'
import { FiHome, FiList, FiUsers, FiCalendar, FiLayers, FiUser } from 'react-icons/fi'
import {
  EventPermissions,
  SubscriptionPermissions,
  TeamInstancePermissions,
  TeamTemplatePermissions,
} from '../../../../common/permissions'
import { ROUTE_PATHS } from '../../constants/routePaths'

export type SidebarNavItem = {
  label: string
  path: string
  icon: IconType
  permission?: string
  /**
   * Only shown to users who belong to a team in the current event. Not a
   * permission (no permission models "has a membership"), so it's filtered at
   * render time against the caller's team-membership state.
   */
  requiresTeamMembership?: boolean
  /**
   * Only shown when the `current-event-my-team` feature flag is enabled. Not a
   * permission, so it's filtered at render time against the feature-flag state.
   */
  requiresMyTeamFlag?: boolean
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
        label: 'Minha Equipe',
        path: ROUTE_PATHS.MY_TEAM,
        icon: FiUser,
        requiresTeamMembership: true,
        requiresMyTeamFlag: true,
      },
    ],
  },
  {
    title: 'GERENCIAMENTO',
    items: [
      {
        label: 'Inscrições',
        path: ROUTE_PATHS.SUBSCRIPTIONS,
        icon: FiList,
        permission: SubscriptionPermissions.Read,
      },
      {
        label: 'Equipes',
        path: ROUTE_PATHS.TEAMS,
        icon: FiUsers,
        permission: TeamInstancePermissions.Read,
      },
      {
        label: 'Eventos',
        path: ROUTE_PATHS.EVENTS,
        icon: FiCalendar,
        permission: EventPermissions.Read,
      },
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      {
        label: 'Modelos de Equipe',
        path: ROUTE_PATHS.TEAM_TEMPLATES,
        icon: FiLayers,
        permission: TeamTemplatePermissions.Read,
      },
    ],
  },
]
