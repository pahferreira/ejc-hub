import type { EventFeeMemberRow, TeamMemberFeeRow } from '../../services/finance/finance.types'

/**
 * Shared fixtures for the stories and the unit specs. Kept in one place because
 * three files need the same shape; only stories and `*.spec.ts` import it, so it
 * is tree-shaken out of the app bundle.
 */
export function buildMemberFeeRow(
  overrides: Partial<TeamMemberFeeRow> & Pick<TeamMemberFeeRow, 'userId' | 'name'>
): TeamMemberFeeRow {
  return {
    nickname: overrides.name.split(' ')[0],
    phone: '(11) 91000-4000',
    pictureUrl: null,
    experienceType: 'experienced',
    circleKey: null,
    membershipType: 'member',
    status: 'pending',
    ...overrides,
  }
}

/** 5 paid / 3 pending → 63%, matching the design mock's footer. */
export const mixedMemberFeeRows: TeamMemberFeeRow[] = [
  buildMemberFeeRow({
    userId: 'u-1',
    name: 'Maria Silva',
    nickname: 'Mari',
    membershipType: 'coordinator',
    status: 'paid',
  }),
  buildMemberFeeRow({
    userId: 'u-2',
    name: 'João Santos',
    nickname: 'Joca',
    phone: '(11) 91000-4001',
    status: 'paid',
  }),
  buildMemberFeeRow({
    userId: 'u-3',
    name: 'Lucas Andrade',
    nickname: 'Luquinhas',
    phone: '(11) 91000-4002',
    experienceType: 'newbie',
    circleKey: 'green',
    status: 'pending',
  }),
  buildMemberFeeRow({
    userId: 'u-4',
    name: 'Alice Santos',
    nickname: 'Ali',
    phone: '(11) 91000-4003',
    experienceType: 'newbie',
    circleKey: 'blue',
    status: 'paid',
  }),
  buildMemberFeeRow({
    userId: 'u-5',
    name: 'Júlia Barbosa',
    nickname: 'Ju',
    phone: '(11) 91000-4004',
    status: 'pending',
  }),
  buildMemberFeeRow({
    userId: 'u-6',
    name: 'Pedro Henrique',
    nickname: 'Pedrão',
    phone: null,
    experienceType: 'experienced_outsider',
    status: 'paid',
  }),
  buildMemberFeeRow({
    userId: 'u-7',
    name: 'Beatriz Nunes',
    nickname: 'Bia',
    phone: '(11) 91000-4006',
    status: 'pending',
  }),
  buildMemberFeeRow({
    userId: 'u-8',
    name: 'Rafael Costa',
    nickname: 'Rafa',
    phone: '(11) 91000-4007',
    membershipType: 'coordinator',
    status: 'paid',
  }),
]

const MOCK_TEAMS = [
  { teamId: 't-1', teamKey: 'acolhida', teamName: 'Acolhida' },
  { teamId: 't-2', teamKey: 'cozinha', teamName: 'Cozinha' },
  { teamId: 't-3', teamKey: 'liturgia', teamName: 'Liturgia' },
]

/** The event-wide row: the same person, plus the team they belong to. */
export function buildEventFeeMemberRow(
  overrides: Partial<EventFeeMemberRow> & Pick<EventFeeMemberRow, 'userId' | 'name'>
): EventFeeMemberRow {
  return {
    ...buildMemberFeeRow(overrides),
    ...MOCK_TEAMS[0],
    ...overrides,
  }
}

/**
 * The same eight people spread across three teams, so the mixed-team columns
 * (dot + name) have something to distinguish. Still 5 paid / 3 pending.
 */
export const mixedEventFeeMemberRows: EventFeeMemberRow[] = mixedMemberFeeRows.map(
  (row, index) => ({
    ...row,
    ...MOCK_TEAMS[index % MOCK_TEAMS.length],
  })
)
