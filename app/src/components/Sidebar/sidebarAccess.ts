import { hasPermission, type Permission } from '../../../../common/permissions'
import type { FeatureFlagValue } from '../../hooks/useFeatureFlag/feature-flags'
import type { SidebarNavGroup, SidebarNavItem } from './sidebarNav'

/** What the nav decides from: the token's permissions and the current-event membership. */
export type NavViewer = {
  permissions: string[]
  hasTeam: boolean
  isCoordinator: boolean
}

/** Who may see a nav item. */
export type NavAccessRule = (viewer: NavViewer) => boolean

/** Holders of `permission`. */
export const withPermission =
  (permission: Permission): NavAccessRule =>
  (viewer) =>
    hasPermission(viewer.permissions, permission)

/**
 * Anyone on a team in the current event. Not a permission (no permission models
 * "has a membership"), so it reads the caller's team-membership state.
 */
export const teamMembers: NavAccessRule = (viewer) => viewer.hasTeam

/**
 * Coordinators of a team in the current event. Not a permission for the same
 * reason: coordinating is a `team_memberships` row, not a role grant.
 */
export const coordinators: NavAccessRule = (viewer) => viewer.isCoordinator

/** Anyone on a team, or holders of `permission`: a page open to every team and to the admins, who may be on none. */
export const teamMembersOrWithPermission =
  (permission: Permission): NavAccessRule =>
  (viewer) =>
    teamMembers(viewer) || withPermission(permission)(viewer)

function isNavItemVisible(
  item: SidebarNavItem,
  viewer: NavViewer,
  isFeatureEnabled: (flag: FeatureFlagValue) => boolean
): boolean {
  if (item.visibleTo && !item.visibleTo(viewer)) {
    return false
  }

  if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
    return false
  }

  if (item.featureFlagByMembership) {
    const flag = viewer.isCoordinator
      ? item.featureFlagByMembership.coordinator
      : item.featureFlagByMembership.member

    return isFeatureEnabled(flag)
  }

  return true
}

/**
 * The nav groups as `viewer` sees them: each item kept when its access rule and
 * its feature flag allow, and a group dropped once it has no items left.
 */
export function visibleNavGroups(
  groups: SidebarNavGroup[],
  viewer: NavViewer,
  isFeatureEnabled: (flag: FeatureFlagValue) => boolean
): SidebarNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isNavItemVisible(item, viewer, isFeatureEnabled)),
    }))
    .filter((group) => group.items.length > 0)
}
