import { useState } from 'react'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useCurrentUserQuery } from '../../services/users/useCurrentUserQuery'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import { hasPermission } from '../../../../common/permissions'
import { SidebarContent } from './SidebarContent'
import type { SidebarNavProps } from './SidebarContent'
import { MobileSidebar } from './MobileSidebar'
import { sidebarNavGroups } from './sidebarNav'
import { MOBILE_MEDIA_QUERY } from '../../constants/breakpoints'

const STORAGE_KEY = 'ejc-sidebar-collapsed'

const getInitialCollapsed = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches
  } catch {
    return false
  }
}

export type SidebarViewProps = SidebarNavProps & {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

/** The desktop rail: an in-flow column the page content sits next to. */
export function SidebarView(props: SidebarViewProps) {
  return (
    <aside
      className={`sticky top-0 h-screen bg-sidebar-background border-r border-secondary/30 flex flex-col transition-all duration-200 shrink-0 overflow-hidden ${
        props.isCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      <SidebarContent
        groups={props.groups}
        userName={props.userName}
        userNickname={props.userNickname}
        userPicture={props.userPicture}
        onLogout={props.onLogout}
        isCollapsed={props.isCollapsed}
        onToggleCollapse={props.onToggleCollapse}
      />
    </aside>
  )
}

export type SidebarProps = {
  /** Mobile only — on desktop the rail is always visible. */
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar(props: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed)
  const { permissions, user, logout } = useAuthentication()
  const currentUser = useCurrentUserQuery()
  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const { isFeatureEnabled } = useFeatureFlag()
  const hasTeam = Boolean(subscriptionStatus.data?.assignedTeam)
  const isCoordinator = subscriptionStatus.data?.myMembershipType === 'coordinator'

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  const filteredGroups = sidebarNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.permission && !hasPermission(permissions, item.permission)) {
          return false
        }
        if (item.requiresTeamMembership && !hasTeam) {
          return false
        }
        if (item.requiresCoordinator && !isCoordinator) {
          return false
        }
        if (item.featureFlag && !isFeatureEnabled(item.featureFlag, false)) {
          return false
        }
        return true
      }),
    }))
    .filter((group) => group.items.length > 0)

  const navProps: SidebarNavProps = {
    groups: filteredGroups,
    userName: currentUser.data?.name ?? user?.name,
    userNickname: currentUser.data?.nickname ?? undefined,
    userPicture: currentUser.data?.pictureUrl ?? user?.picture,
    onLogout: logout,
  }

  return (
    <>
      {/*
        The rail is desktop-only. The wrapper (rather than `SidebarView` itself)
        carries the breakpoint so `SidebarView` stays a plain presentational
        component that renders everywhere, Storybook's mobile viewport included.
      */}
      <div className="hidden md:flex">
        <SidebarView {...navProps} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      <MobileSidebar {...navProps} open={props.isMobileOpen} onClose={props.onCloseMobile} />
    </>
  )
}
