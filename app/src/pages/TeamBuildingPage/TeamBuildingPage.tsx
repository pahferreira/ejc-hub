import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '../../components/Button/Button'
import { SearchInput } from '../../components/SearchInput/SearchInput'
import { MultiSelector, type Option } from '../../components/MultiSelector/MultiSelector'
import { FilterCheck } from '../../components/FilterCheck/FilterCheck'
import { FilterToggle } from '../../components/FilterToggle/FilterToggle'
import { StatChip } from '../../components/StatChip/StatChip'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { useCurrentEventBoardQuery } from '../../services/team-building/useCurrentEventBoardQuery'
import { useApplyAssignmentsMutation } from '../../services/team-building/useApplyAssignmentsMutation'
import { useTeamBuildingDraft } from './useTeamBuildingDraft'
import { DroppableColumn } from './DroppableColumn'
import { SortableColumn } from './SortableColumn'
import { MemberCard } from './MemberCard'
import { capacityFilterOptions, experienceFilterOptions, type CapacityFilter } from './experience'
import type {
  ExperienceType,
  TeamBoardColumn,
  TeamBoardMember,
} from '../../services/team-building/team-building.types'

function matchesCapacity(column: TeamBoardColumn, filter: CapacityFilter) {
  // Sem Equipe / Lista de Espera always stay on the board so members can be
  // dragged from them regardless of the capacity filter.
  if (filter === 'all' || column.kind !== 'team' || column.max === undefined) {
    return true
  }
  return filter === 'available' ? column.count < column.max : column.count >= column.max
}

export function TeamBuildingPage() {
  const navigate = useNavigate()
  const boardQuery = useCurrentEventBoardQuery()
  const applyAssignments = useApplyAssignmentsMutation()
  const draft = useTeamBuildingDraft(boardQuery.data)

  const [search, setSearch] = useState('')
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Keep the session-local team-column order in sync with the board: preserve
  // the current order, append newly seen teams, drop any that disappear.
  useEffect(() => {
    const teamIds = draft.columns.filter((column) => column.kind === 'team').map((c) => c.id)
    setColumnOrder((prev) => {
      const kept = prev.filter((id) => teamIds.includes(id))
      const added = teamIds.filter((id) => !kept.includes(id))
      const next = [...kept, ...added]
      const unchanged = next.length === prev.length && next.every((id, i) => id === prev[i])
      return unchanged ? prev : next
    })
  }, [draft.columns])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const memberById = useMemo(() => {
    const map = new Map<string, TeamBoardMember>()
    draft.columns.forEach((column) => {
      column.members.forEach((member) => map.set(member.userId, member))
    })
    return map
  }, [draft.columns])

  const activeMember = activeId ? (memberById.get(activeId) ?? null) : null

  const teamOptions = useMemo<Option[]>(
    () =>
      draft.columns
        .filter((column) => column.kind === 'team')
        .map((column) => ({ value: column.id, label: column.title })),
    [draft.columns]
  )

  const selectedTeamOptions = teamOptions.filter((option) => selectedTeamIds.includes(option.value))

  const handleDragStart = (event: DragStartEvent) => {
    // Only member drags need the card overlay; column drags move themselves.
    if (event.active.data.current?.type === 'column') {
      return
    }
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) {
      return
    }

    if (active.data.current?.type === 'column') {
      if (active.id !== over.id) {
        setColumnOrder((prev) => {
          const oldIndex = prev.indexOf(String(active.id))
          const newIndex = prev.indexOf(String(over.id))
          // over may be a fixed column (not in the order) — ignore those drops so
          // Sem Equipe / Lista de Espera stay pinned as the first two.
          if (oldIndex === -1 || newIndex === -1) {
            return prev
          }
          return arrayMove(prev, oldIndex, newIndex)
        })
      }
      return
    }

    draft.moveMember(String(active.id), String(over.id))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const stats = useMemo(() => {
    const assigned = draft.columns
      .filter((column) => column.kind === 'team')
      .reduce((total, column) => total + column.count, 0)
    const waiting = draft.columns.find((column) => column.kind === 'waiting_list')?.count ?? 0
    return { assigned, waiting }
  }, [draft.columns])

  const visibleColumns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    // Team filter narrows the member cards by the teams they signed up for,
    // matching member.preferences (team names) against the selected teams.
    const selectedTeamNames = new Set(
      teamOptions.filter((option) => selectedTeamIds.includes(option.value)).map((o) => o.label)
    )
    return draft.columns
      .filter((column) => matchesCapacity(column, capacityFilter))
      .map((column) => ({
        ...column,
        members: column.members.filter((member) => {
          const matchesSearch =
            !normalizedSearch || member.name.toLowerCase().includes(normalizedSearch)
          const matchesExperience =
            experienceFilter.length === 0 ||
            experienceFilter.includes(member.experienceType as ExperienceType)
          const matchesTeam =
            selectedTeamNames.size === 0 ||
            member.preferences.some((preference) => selectedTeamNames.has(preference))
          return matchesSearch && matchesExperience && matchesTeam
        }),
      }))
  }, [draft.columns, search, experienceFilter, capacityFilter, selectedTeamIds, teamOptions])

  // Sem Equipe / Lista de Espera are always rendered first, in board order.
  const fixedColumns = visibleColumns.filter((column) => column.kind !== 'team')

  // Team columns follow the user-defined order; the rest keep their relative order.
  const orderedTeamColumns = useMemo(() => {
    const rank = new Map(columnOrder.map((id, index) => [id, index]))
    return visibleColumns
      .filter((column) => column.kind === 'team')
      .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
  }, [visibleColumns, columnOrder])

  const handleSave = () => {
    applyAssignments.mutate(draft.diff())
  }

  if (boardQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando montagem...</div>
      </div>
    )
  }

  if (boardQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {boardQuery.error.message}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <nav aria-label="Trilha" className="mb-2 text-sm text-secondary-foreground">
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.TEAMS)}
            className="hover:cursor-pointer hover:underline"
          >
            Equipes
          </button>
          <span aria-hidden="true" className="mx-1.5">
            ›
          </span>
          <span className="text-dark-brown">Montagem Início</span>
        </nav>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 m-0">Montagem Início</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Organize a lista de espera e os membros sem equipe antes de distribuí-los entre as
              equipes do encontro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(ROUTE_PATHS.TEAMS)}>
              ← Voltar para Equipes
            </Button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatChip label="Atribuídos" value={stats.assigned} />
          <StatChip label="Aguardando" value={stats.waiting} variant="waiting" />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <SearchInput placeholder="Buscar membro..." value={search} onChange={setSearch} />
          </div>
          <div className="w-56">
            <MultiSelector
              options={teamOptions}
              selected={selectedTeamOptions}
              onChange={(options) => setSelectedTeamIds(options.map((option) => option.value))}
              placeholder="Todas as equipes"
            />
          </div>
          <FilterCheck
            label="Exp"
            options={experienceFilterOptions}
            value={experienceFilter}
            onChange={setExperienceFilter}
            ariaLabel="Filtrar por experiência"
          />
          <FilterToggle
            options={capacityFilterOptions}
            value={capacityFilter}
            onChange={(value) => setCapacityFilter(value as CapacityFilter)}
            ariaLabel="Filtrar por capacidade"
          />
          <Button onClick={handleSave} disabled={!draft.isDirty || applyAssignments.isPending}>
            {applyAssignments.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <p className="mb-6 text-sm text-secondary-foreground">
          As alterações só são aplicadas ao clicar em <strong>Salvar</strong>. Arraste os membros
          entre as colunas para montar as equipes.
        </p>

        {applyAssignments.error && (
          <p className="mb-4 text-sm text-red-600">
            Não foi possível salvar as alterações. Tente novamente.
          </p>
        )}

        <DndContext
          sensors={sensors}
          accessibility={{ restoreFocus: false }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {fixedColumns.map((column) => (
              <DroppableColumn key={column.id} column={column} />
            ))}
            <SortableContext
              items={orderedTeamColumns.map((column) => column.id)}
              strategy={horizontalListSortingStrategy}
            >
              {orderedTeamColumns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  isOverCapacity={column.max !== undefined && column.count > column.max}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeMember && (
              <div className="w-80 rotate-2 cursor-grabbing">
                <MemberCard member={activeMember} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
