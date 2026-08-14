import { useCallback, useMemo, useState } from 'react'
import { useAssignCoordinatorCandidatesQuery } from '../../services/team-building/useAssignCoordinatorCandidatesQuery'
import { useAddMembersMutation } from '../../services/team-building/useAddMembersMutation'
import { filterCandidates } from '../AssignCoordinatorDrawer/assignCoordinatorDrawerUtils'
import type { TeamPreferenceScope } from '../TeamPreferenceFilter/TeamPreferenceFilter'

type TargetTeam = {
  id: string
  name: string
  memberCount: number
  maxCapacity: number
}

export function useAddMembersDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<TargetTeam | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filter state
  const [search, setSearch] = useState('')
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [preferenceScope, setPreferenceScope] = useState<TeamPreferenceScope>('team')
  const [viewSelectedOnly, setViewSelectedOnly] = useState(false)

  const candidatesQuery = useAssignCoordinatorCandidatesQuery(target?.id ?? null, 'member')
  const mutation = useAddMembersMutation()

  const open = useCallback((team: TargetTeam) => {
    setTarget(team)
    setSelectedIds([])
    setSearch('')
    setExperienceFilter([])
    setPreferenceScope('team')
    setViewSelectedOnly(false)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTarget(null)
    setSelectedIds([])
    setViewSelectedOnly(false)
  }, [])

  const toggle = useCallback((userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }, [])

  // "View selected only" only makes sense while a selection exists; it collapses
  // back to the full list automatically once nothing is selected.
  const effectiveViewSelectedOnly = viewSelectedOnly && selectedIds.length > 0

  const toggleViewSelectedOnly = useCallback(() => {
    setViewSelectedOnly((prev) => !prev)
  }, [])

  const filteredCandidates = useMemo(() => {
    if (!candidatesQuery.data || !target) return []
    const filtered = filterCandidates(candidatesQuery.data.candidates, {
      search,
      experienceFilter,
      preferenceScope,
      targetTeamId: target.id,
    })
    if (effectiveViewSelectedOnly) {
      return filtered.filter((candidate) => selectedIds.includes(candidate.userId))
    }
    return filtered
  }, [
    candidatesQuery.data,
    target,
    search,
    experienceFilter,
    preferenceScope,
    effectiveViewSelectedOnly,
    selectedIds,
  ])

  const resultCount = filteredCandidates.length
  const selectedCount = selectedIds.length
  const canSave = selectedCount > 0

  const save = useCallback(() => {
    if (!target || !canSave) return
    mutation.mutate(
      { teamInstanceId: target.id, userIds: selectedIds },
      { onSuccess: () => close() }
    )
  }, [target, canSave, selectedIds, mutation, close])

  return {
    isOpen,
    open,
    close,
    target,
    selectedIds,
    selectedCount,
    toggle,
    canSave,
    search,
    setSearch,
    experienceFilter,
    setExperienceFilter,
    preferenceScope,
    setPreferenceScope,
    viewSelectedOnly: effectiveViewSelectedOnly,
    toggleViewSelectedOnly,
    filteredCandidates,
    resultCount,
    save,
    isSaving: mutation.isPending,
    isLoading: candidatesQuery.isLoading,
    error: candidatesQuery.error,
  }
}
