import type {
  CoordinatorCandidate,
  CoordinatorSlots,
} from '../../services/team-building/team-building.types'

/** Extracts non-null IDs from the positional coordinator slots. */
export function getSeedIds(slots: CoordinatorSlots): string[] {
  return [slots.first, slots.second, slots.third].filter((id): id is string => id !== null)
}

/** Derives slot-rule values from current selection and edit-mode state. */
export function computeSlotRules(selectedIds: string[], isEditMode: boolean) {
  const slotsUsed = selectedIds.length
  const maxReached = slotsUsed >= 3
  // Option A: allow save at 0 only when editing an existing assignment.
  const canSave = slotsUsed >= 1 || isEditMode
  return { slotsUsed, maxReached, canSave }
}

/** Returns true when the given userId should be disabled (not selected but max reached). */
export function isDisabledId(userId: string, selectedIds: string[], maxReached: boolean): boolean {
  return !selectedIds.includes(userId) && maxReached
}

type FilterArgs = {
  search: string
  experienceFilter: string[]
  preferenceScope: 'team' | 'all'
  targetTeamId: string
}

/** Filters the candidate list client-side. Selection state is NOT considered here. */
export function filterCandidates(
  candidates: CoordinatorCandidate[],
  args: FilterArgs
): CoordinatorCandidate[] {
  return candidates.filter((c) => {
    if (args.search) {
      const q = args.search.toLowerCase()
      const matchesName = c.name.toLowerCase().includes(q)
      const matchesNickname = c.nickname.toLowerCase().includes(q)
      if (!matchesName && !matchesNickname) return false
    }

    if (args.experienceFilter.length > 0 && !args.experienceFilter.includes(c.experienceType)) {
      return false
    }

    if (args.preferenceScope === 'team' && !c.preferenceTeamIds.includes(args.targetTeamId)) {
      return false
    }

    return true
  })
}
