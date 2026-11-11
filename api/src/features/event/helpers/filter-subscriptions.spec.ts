import { describe, it, expect } from 'vitest'

import { filterSubscriptions } from './filter-subscriptions.ts'
import type { SubscriptionWithDetails } from '../domain/subscription-types.ts'

const TEAM_A = 'team-a'
const TEAM_B = 'team-b'

const NO_SKILLS = {
  hasActingSkills: false,
  hasCommunicationSkills: false,
  hasCookingSkills: false,
  hasDancingSkills: false,
  hasManualSkills: false,
  hasMusicSkills: false,
  hasSingingSkills: false,
  hasGuitarSkills: false,
  hasPercussionSkills: false,
  hasMidiaSkills: false,
}

function buildSubscription(
  overrides: Partial<SubscriptionWithDetails> & { id: string },
  userOverrides: Partial<SubscriptionWithDetails['user']> = {}
): SubscriptionWithDetails {
  return {
    userId: `user-${overrides.id}`,
    status: 'pending',
    createdAt: new Date('2026-01-01'),
    availability: [],
    details: null,
    teams: [],
    ...overrides,
    user: {
      name: 'Maria Silva',
      nickname: 'Mari',
      email: 'mari@example.com',
      phone: null,
      instagram: null,
      pictureUrl: null,
      experienceType: 'newbie',
      circle: null,
      hasCoordinatorExperience: false,
      ...NO_SKILLS,
      ...userOverrides,
    },
  }
}

const singer = buildSubscription(
  { id: 's1', teams: [TEAM_A], status: 'completed' },
  { name: 'Júlia Ramos', hasSingingSkills: true }
)

const guitarist = buildSubscription(
  { id: 's2', teams: [TEAM_B], status: 'pending' },
  { name: 'Bruno Carvalho', experienceType: 'experienced', hasGuitarSkills: true }
)

const unskilled = buildSubscription(
  { id: 's3', teams: [], status: 'cancelled' },
  { name: 'Ana Souza', experienceType: 'experienced_outsider' }
)

const rows = [singer, guitarist, unskilled]

const idsOf = (subscriptions: SubscriptionWithDetails[]) => subscriptions.map((s) => s.id)

describe('filterSubscriptions', () => {
  it('returns every subscription when no filter is given', () => {
    expect(filterSubscriptions(rows)).toEqual(rows)
  })

  it('returns every subscription when every control is cleared', () => {
    expect(
      idsOf(filterSubscriptions(rows, { teamIds: [], status: [], skills: [], experience: [] }))
    ).toEqual(['s1', 's2', 's3'])
  })

  it('matches a name case-insensitively on a partial', () => {
    expect(idsOf(filterSubscriptions(rows, { name: 'bru' }))).toEqual(['s2'])
  })

  it('keeps a subscriber carrying any of the selected skills', () => {
    const filtered = filterSubscriptions(rows, {
      skills: ['has_singing_skills', 'has_guitar_skills'],
    })

    expect(idsOf(filtered)).toEqual(['s1', 's2'])
  })

  it('drops a subscriber carrying none of the selected skills', () => {
    expect(idsOf(filterSubscriptions(rows, { skills: ['has_cooking_skills'] }))).toEqual([])
  })

  it('matches nobody when every selected skill is outside the shared vocabulary', () => {
    // A stale bookmark asking for a skill that no longer exists should show an
    // empty table, not quietly fall back to showing everyone.
    expect(idsOf(filterSubscriptions(rows, { skills: ['has_telepathy_skills'] }))).toEqual([])
  })

  it('ignores an unknown skill sitting alongside a known one', () => {
    expect(
      idsOf(filterSubscriptions(rows, { skills: ['has_telepathy_skills', 'has_guitar_skills'] }))
    ).toEqual(['s2'])
  })

  it('narrows by a single experience type', () => {
    expect(idsOf(filterSubscriptions(rows, { experience: ['newbie'] }))).toEqual(['s1'])
  })

  it('keeps subscribers matching any of the selected experience types', () => {
    const filtered = filterSubscriptions(rows, {
      experience: ['experienced', 'experienced_outsider'],
    })

    expect(idsOf(filtered)).toEqual(['s2', 's3'])
  })

  it('ignores hasCoordinatorExperience, which is a different thing entirely', () => {
    const coordinator = buildSubscription({ id: 's4' }, { hasCoordinatorExperience: true })

    expect(idsOf(filterSubscriptions([coordinator], { experience: ['experienced'] }))).toEqual([])
  })

  it('narrows by team membership', () => {
    expect(idsOf(filterSubscriptions(rows, { teamIds: [TEAM_A] }))).toEqual(['s1'])
  })

  it('narrows by status', () => {
    expect(idsOf(filterSubscriptions(rows, { status: ['cancelled'] }))).toEqual(['s3'])
  })

  it('composes skills and experience with AND', () => {
    // The guitarist matches the skill but not the experience, so nothing is left.
    const filtered = filterSubscriptions(rows, {
      skills: ['has_guitar_skills'],
      experience: ['newbie'],
    })

    expect(idsOf(filtered)).toEqual([])
  })

  it('composes the new filters with name, team and status', () => {
    const filtered = filterSubscriptions(rows, {
      name: 'júlia',
      teamIds: [TEAM_A],
      status: ['completed'],
      skills: ['has_singing_skills'],
      experience: ['newbie'],
    })

    expect(idsOf(filtered)).toEqual(['s1'])
  })

  it('leaves the given list untouched', () => {
    const original = [...rows]

    filterSubscriptions(rows, { skills: ['has_singing_skills'] })

    expect(rows).toEqual(original)
  })
})
