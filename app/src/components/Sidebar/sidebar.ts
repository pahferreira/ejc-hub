import type { IconType } from 'react-icons'
import { FiHome, FiList, FiUsers, FiCalendar, FiLayers } from 'react-icons/fi'
import {
  EventPermissions,
  SubscriptionPermissions,
  TeamTemplatePermissions,
} from '../../../../common/permissions'
import { ROUTE_PATHS } from '../../constants/routePaths'

export type SidebarNavItem = {
  label: string
  path: string
  icon: IconType
  permission?: string
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
        permission: SubscriptionPermissions.Read,
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
