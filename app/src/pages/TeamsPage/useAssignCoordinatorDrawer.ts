import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAssignCoordinatorCandidatesQuery } from '../../services/team-building/useAssignCoordinatorCandidatesQuery'
import { useAssignCoordinatorsMutation } from '../../services/team-building/useAssignCoordinatorsMutation'
import {
  computeSlotRules,
  filterCandidates,
  getSeedIds,
  isDisabledId,
} from './assignCoordinatorDrawerUtils'
import type { TeamPreferenceScope } from '../../components/TeamPreferenceFilter/TeamPreferenceFilter'

type TargetTeam = {
  id: string
  name: string
}

export function useAssignCoordinatorDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<TargetTeam | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [preferenceScope, setPreferenceScope] = useState<TeamPreferenceScope>('all')

  const candidatesQuery = useAssignCoordinatorCandidatesQuery(target?.id ?? null)
  const mutation = useAssignCoordinatorsMutation()

  // Seed selection once data becomes available (or when isOpen flips to true for cached data).
  useEffect(() => {
    if (isOpen && candidatesQuery.data) {
      const seedIds = getSeedIds(candidatesQuery.data.currentCoordinators)
      setSelectedIds(seedIds)
      setIsEditMode(seedIds.length > 0)
    }
  }, [isOpen, candidatesQuery.data])

  const open = useCallback((team: TargetTeam) => {
    setTarget(team)
    setSelectedIds([])
    setIsEditMode(false)
    setSearch('')
    setExperienceFilter([])
    setPreferenceScope('all')
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTarget(null)
    setSelectedIds([])
    setIsEditMode(false)
  }, [])

  const toggle = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      }
      if (prev.length >= 3) return prev
      return [...prev, userId]
    })
  }, [])

  const { slotsUsed, maxReached, canSave } = computeSlotRules(selectedIds, isEditMode)

  const filteredCandidates = useMemo(() => {
    if (!candidatesQuery.data || !target) return []
    return filterCandidates(candidatesQuery.data.candidates, {
      search,
      experienceFilter,
      preferenceScope,
      targetTeamId: target.id,
    })
  }, [candidatesQuery.data, search, experienceFilter, preferenceScope, target])

  const resultCount = filteredCandidates.length

  const save = useCallback(() => {
    if (!target || !canSave) return
    mutation.mutate(
      { teamInstanceId: target.id, coordinatorIds: selectedIds },
      { onSuccess: () => close() }
    )
  }, [target, canSave, selectedIds, mutation, close])

  const isDisabled = useCallback(
    (userId: string) => isDisabledId(userId, selectedIds, maxReached),
    [selectedIds, maxReached]
  )

  // Build ordered {id, name, nickname} entries from candidates for the CoordinatorSlots display.
  const selectedCoordinators = useMemo(() => {
    const candidates = candidatesQuery.data?.candidates ?? []
    const candidateMap = new Map(candidates.map((c) => [c.userId, c]))
    return selectedIds.map((id) => {
      const candidate = candidateMap.get(id)
      return { id, name: candidate?.name ?? id, nickname: candidate?.nickname ?? id }
    })
  }, [selectedIds, candidatesQuery.data?.candidates])

  return {
    isOpen,
    open,
    close,
    target,
    selectedIds,
    selectedCoordinators,
    toggle,
    isDisabled,
    slotsUsed,
    maxReached,
    canSave,
    search,
    setSearch,
    experienceFilter,
    setExperienceFilter,
    preferenceScope,
    setPreferenceScope,
    filteredCandidates,
    resultCount,
    save,
    isSaving: mutation.isPending,
    isLoading: candidatesQuery.isLoading,
    error: candidatesQuery.error,
  }
}
