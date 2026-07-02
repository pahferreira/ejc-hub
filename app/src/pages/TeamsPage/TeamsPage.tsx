import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DashboardSection } from '../../components/DashboardSection/DashboardSection'
import { SubscriptionSummaryBox } from '../../components/SubscriptionSummaryBox/SubscriptionSummaryBox'
import { Button } from '../../components/Button/Button'
import { TeamHealthCard } from '../../components/TeamHealthCard/TeamHealthCard'
import {
  TeamsToolbar,
  type TeamsStatusFilter,
  type TeamsSortOption,
  type TeamsViewMode,
} from '../../components/TeamsToolbar/TeamsToolbar'
import { useCurrentEventTeamsQuery } from '../../services/teams/useCurrentEventTeamsQuery'
import { useTeamsOverviewQuery } from '../../services/teams/useTeamsOverviewQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ROUTE_PATHS } from '../../constants/routePaths'
import type { TeamsListFilters } from '../../services/teams/teams.types'
import { useAssignCoordinatorDrawer } from './useAssignCoordinatorDrawer'
import { AssignCoordinatorDrawer } from './AssignCoordinatorDrawer'

export function TeamsPage() {
  const navigate = useNavigate()
  const drawer = useAssignCoordinatorDrawer()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TeamsStatusFilter>('all')
  const [sort, setSort] = useState<TeamsSortOption>('name_asc')
  const [viewMode, setViewMode] = useState<TeamsViewMode>('grid')

  const debouncedSearch = useDebouncedValue(search, 300)

  const filters: TeamsListFilters = {
    ...(debouncedSearch ? { name: debouncedSearch } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const overviewQuery = useTeamsOverviewQuery()
  const teamsQuery = useCurrentEventTeamsQuery(filters)

  const visibleTeams = useMemo(() => {
    const teams = teamsQuery.data ?? []
    return [...teams].sort((a, b) => a.templateName.localeCompare(b.templateName))
  }, [teamsQuery.data])

  const isLoading = overviewQuery.isLoading || teamsQuery.isLoading
  const error = overviewQuery.error ?? teamsQuery.error

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando equipes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    )
  }

  const stats = overviewQuery.data ?? {
    completed: 0,
    partiallyCompleted: 0,
    inRisk: 0,
    total: 0,
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 m-0">Equipes</h1>
            <p className="mt-2 text-gray-600">
              Acompanhe a montagem das equipes do próximo encontro
            </p>
          </div>
          <Button onClick={() => navigate(ROUTE_PATHS.TEAMS_TEAM_BUILDING)}>Montagem</Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8">
          <SubscriptionSummaryBox
            title="Equipes completas"
            value={stats.completed}
            description={`de ${stats.total} equipes`}
            variant="completed"
          />
          <SubscriptionSummaryBox
            title="Parcialmente completas"
            value={stats.partiallyCompleted}
            variant="received"
          />
          <SubscriptionSummaryBox
            title="Em risco"
            value={stats.inRisk}
            description="Menos de 50% preenchidas"
            variant="pending"
          />
        </div>

        <DashboardSection>
          <div className="mb-6">
            <TeamsToolbar
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {visibleTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhuma equipe encontrada para o evento atual.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTeams.map((team) => (
                <TeamHealthCard
                  key={team.id}
                  team={team}
                  onAssignCoordinator={() => drawer.open({ id: team.id, name: team.templateName })}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <AssignCoordinatorDrawer {...drawer} />
    </div>
  )
}
