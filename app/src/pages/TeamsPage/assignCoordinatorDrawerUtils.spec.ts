import { describe, it, expect } from 'vitest'
import {
  computeSlotRules,
  filterCandidates,
  getSeedIds,
  isDisabledId,
} from './assignCoordinatorDrawerUtils'
import type {
  CoordinatorCandidate,
  CoordinatorSlots,
} from '../../services/team-building/team-building.types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeCandidate = (overrides: Partial<CoordinatorCandidate> = {}): CoordinatorCandidate => ({
  userId: 'user-1',
  name: 'João da Silva',
  nickname: 'Joãozinho',
  experienceType: 'newbie',
  areas: [],
  preferenceTeamIds: [],
  preferences: [],
  ...overrides,
})

const slots = (
  first: string | null,
  second: string | null,
  third: string | null
): CoordinatorSlots => ({ first, second, third })

// ---------------------------------------------------------------------------
// getSeedIds
// ---------------------------------------------------------------------------

describe('getSeedIds', () => {
  it('returns empty array when all slots are null', () => {
    expect(getSeedIds(slots(null, null, null))).toEqual([])
  })

  it('returns only non-null slot ids', () => {
    expect(getSeedIds(slots('u1', null, 'u3'))).toEqual(['u1', 'u3'])
  })

  it('returns all three when all are filled', () => {
    expect(getSeedIds(slots('u1', 'u2', 'u3'))).toEqual(['u1', 'u2', 'u3'])
  })
})

// ---------------------------------------------------------------------------
// computeSlotRules — slotsUsed / maxReached / canSave
// ---------------------------------------------------------------------------

describe('computeSlotRules', () => {
  it('slotsUsed equals the length of selectedIds', () => {
    expect(computeSlotRules(['u1', 'u2'], false).slotsUsed).toBe(2)
  })

  it('maxReached is false when fewer than 3 selected', () => {
    expect(computeSlotRules(['u1', 'u2'], false).maxReached).toBe(false)
  })

  it('maxReached is true when 3 are selected', () => {
    expect(computeSlotRules(['u1', 'u2', 'u3'], false).maxReached).toBe(true)
  })

  it('canSave is false when 0 selected and NOT in edit mode', () => {
    expect(computeSlotRules([], false).canSave).toBe(false)
  })

  it('canSave is true when at least 1 is selected regardless of edit mode', () => {
    expect(computeSlotRules(['u1'], false).canSave).toBe(true)
    expect(computeSlotRules(['u1'], true).canSave).toBe(true)
  })

  // Option A: edit mode allows saving at 0 (to clear existing coordinators).
  it('canSave is true at 0 selected when in edit mode', () => {
    expect(computeSlotRules([], true).canSave).toBe(true)
  })

  it('canSave is false at 0 selected when NOT in edit mode (first-time assignment)', () => {
    expect(computeSlotRules([], false).canSave).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isDisabledId
// ---------------------------------------------------------------------------

describe('isDisabledId', () => {
  it('is false when maxReached is false', () => {
    expect(isDisabledId('u4', ['u1', 'u2'], false)).toBe(false)
  })

  it('is false when the id is already selected even at max', () => {
    expect(isDisabledId('u1', ['u1', 'u2', 'u3'], true)).toBe(false)
  })

  it('is true when maxReached and the id is NOT selected', () => {
    expect(isDisabledId('u4', ['u1', 'u2', 'u3'], true)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// filterCandidates — search / experienceFilter / preferenceScope
// ---------------------------------------------------------------------------

const target = 'team-liturgia'

const candidates: CoordinatorCandidate[] = [
  makeCandidate({
    userId: 'u1',
    name: 'Alice Sousa',
    nickname: 'Ali',
    experienceType: 'newbie',
    preferenceTeamIds: [target],
  }),
  makeCandidate({
    userId: 'u2',
    name: 'Bruno Lima',
    nickname: 'Bru',
    experienceType: 'experienced',
    preferenceTeamIds: [],
  }),
  makeCandidate({
    userId: 'u3',
    name: 'Carla Matos',
    nickname: 'Car',
    experienceType: 'experienced_outsider',
    preferenceTeamIds: ['team-louvor'],
  }),
]

describe('filterCandidates — no filters', () => {
  it('returns all candidates when nothing is active', () => {
    const result = filterCandidates(candidates, {
      search: '',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result).toHaveLength(3)
  })
})

describe('filterCandidates — search', () => {
  it('matches by name (case-insensitive)', () => {
    const result = filterCandidates(candidates, {
      search: 'alice',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('u1')
  })

  it('matches by nickname', () => {
    const result = filterCandidates(candidates, {
      search: 'bru',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('u2')
  })

  it('returns empty when search matches nothing', () => {
    const result = filterCandidates(candidates, {
      search: 'zzz',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result).toHaveLength(0)
  })
})

describe('filterCandidates — experienceFilter', () => {
  it('keeps only candidates matching selected experience types', () => {
    const result = filterCandidates(candidates, {
      search: '',
      experienceFilter: ['newbie', 'experienced'],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result.map((c) => c.userId)).toEqual(['u1', 'u2'])
  })
})

describe('filterCandidates — preferenceScope', () => {
  it("with 'team' scope, shows only candidates who listed this team", () => {
    const result = filterCandidates(candidates, {
      search: '',
      experienceFilter: [],
      preferenceScope: 'team',
      targetTeamId: target,
    })
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('u1')
  })

  it("with 'all' scope, ignores preference and returns all", () => {
    const result = filterCandidates(candidates, {
      search: '',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })
    expect(result).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Selection survives filtering (by design, filterCandidates is independent)
// ---------------------------------------------------------------------------

describe('selection independence from filter', () => {
  it('filterCandidates result does NOT affect which ids are "selected"', () => {
    // u1 and u2 are "selected" (selectedIds managed in hook state).
    const selectedIds = ['u1', 'u2']

    // Searching for "carla" returns only u3.
    const filtered = filterCandidates(candidates, {
      search: 'carla',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })

    // The filtered list has 1 result — but selectedIds is unchanged.
    expect(filtered).toHaveLength(1)
    expect(selectedIds).toEqual(['u1', 'u2'])

    // slotsUsed reflects selectedIds, not filtered count.
    const { slotsUsed } = computeSlotRules(selectedIds, false)
    expect(slotsUsed).toBe(2)
  })

  it('resultCount equals filtered list length, not selectedIds length', () => {
    const selectedIds = ['u1', 'u2', 'u3']
    const filtered = filterCandidates(candidates, {
      search: 'alice',
      experienceFilter: [],
      preferenceScope: 'all',
      targetTeamId: target,
    })

    expect(filtered.length).toBe(1) // resultCount
    expect(selectedIds.length).toBe(3) // slotsUsed
  })
})
