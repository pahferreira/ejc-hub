import { describe, it, expect } from 'vitest'
import { FiHome } from 'react-icons/fi'
import { SchedulePermissions } from '../../../../common/permissions'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import {
  coordinators,
  teamMembers,
  teamMembersOrWithPermission,
  visibleNavGroups,
  withPermission,
  type NavViewer,
} from './sidebarAccess'
import type { SidebarNavItem } from './sidebarNav'

const OUTSIDER: NavViewer = { permissions: [], hasTeam: false, isCoordinator: false }
const MEMBER: NavViewer = { permissions: [], hasTeam: true, isCoordinator: false }
const COORDINATOR: NavViewer = { permissions: [], hasTeam: true, isCoordinator: true }
const ADMIN: NavViewer = {
  permissions: [SchedulePermissions.Read],
  hasTeam: false,
  isCoordinator: false,
}

describe('withPermission', () => {
  it('lets in a holder of the permission', () => {
    expect(withPermission(SchedulePermissions.Read)(ADMIN)).toBe(true)
  })

  it('keeps out anyone without it, team or not', () => {
    expect(withPermission(SchedulePermissions.Read)(COORDINATOR)).toBe(false)
  })
})

describe('teamMembers', () => {
  it('lets in members and coordinators of a current-event team', () => {
    expect(teamMembers(MEMBER)).toBe(true)
    expect(teamMembers(COORDINATOR)).toBe(true)
  })

  it('keeps out someone on no team, permissions or not', () => {
    expect(teamMembers(ADMIN)).toBe(false)
  })
})

describe('coordinators', () => {
  it('lets in a coordinator', () => {
    expect(coordinators(COORDINATOR)).toBe(true)
  })

  it('keeps out a plain member', () => {
    expect(coordinators(MEMBER)).toBe(false)
  })
})

describe('teamMembersOrWithPermission', () => {
  const rule = teamMembersOrWithPermission(SchedulePermissions.Read)

  it('lets in anyone on a team, without the permission', () => {
    expect(rule(MEMBER)).toBe(true)
  })

  it('lets in a holder of the permission on no team', () => {
    expect(rule(ADMIN)).toBe(true)
  })

  it('keeps out someone neither on a team nor holding it', () => {
    expect(rule(OUTSIDER)).toBe(false)
  })
})

describe('visibleNavGroups', () => {
  const item = (label: string, extra: Partial<SidebarNavItem> = {}): SidebarNavItem => ({
    label,
    path: `/${label}`,
    icon: FiHome,
    ...extra,
  })
  const allFlagsOn = () => true
  const labels = (groups: ReturnType<typeof visibleNavGroups>) =>
    groups.map((group) => [group.title, group.items.map((navItem) => navItem.label)])

  it('keeps the items whose rule lets the viewer in, and the ones with no rule', () => {
    const groups = [
      {
        title: 'G',
        items: [
          item('everyone'),
          item('team', { visibleTo: teamMembers }),
          item('coord', { visibleTo: coordinators }),
        ],
      },
    ]

    expect(labels(visibleNavGroups(groups, MEMBER, allFlagsOn))).toEqual([
      ['G', ['everyone', 'team']],
    ])
  })

  it('drops an item whose feature flag is off', () => {
    const groups = [{ title: 'G', items: [item('flagged', { featureFlag: FeatureFlag.Schedule })] }]

    expect(visibleNavGroups(groups, MEMBER, () => false)).toEqual([])
  })

  it("reads a by-membership flag from the viewer's membership type", () => {
    const groups = [
      {
        title: 'G',
        items: [
          item('meetings', {
            featureFlagByMembership: {
              coordinator: FeatureFlag.CoordinatorAttendance,
              member: FeatureFlag.AttendanceVisibility,
            },
          }),
        ],
      },
    ]
    const onlyCoordinatorFlag = (flag: string) => flag === FeatureFlag.CoordinatorAttendance

    expect(labels(visibleNavGroups(groups, COORDINATOR, onlyCoordinatorFlag))).toEqual([
      ['G', ['meetings']],
    ])
    expect(visibleNavGroups(groups, MEMBER, onlyCoordinatorFlag)).toEqual([])
  })

  it('drops a group once none of its items is left', () => {
    const groups = [
      {
        title: 'ADMIN',
        items: [item('admin', { visibleTo: withPermission(SchedulePermissions.Read) })],
      },
      { title: 'OPEN', items: [item('open')] },
    ]

    expect(labels(visibleNavGroups(groups, OUTSIDER, allFlagsOn))).toEqual([['OPEN', ['open']]])
  })
})
