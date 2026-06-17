import clsx from 'clsx'
import { FiGrid, FiList, FiTrello } from 'react-icons/fi'
import { ButtonIcon } from '../ButtonIcon/ButtonIcon'
import { SearchInput } from '../SearchInput/SearchInput'
import { Selector, type Option } from '../Selector/Selector'
import type { TeamStatus } from '../../services/teams/teams.types'

export type TeamsStatusFilter = 'all' | Extract<TeamStatus, 'needsMembers' | 'complete'>

export type TeamsSortOption = 'name_asc'

export type TeamsViewMode = 'grid' | 'list' | 'kanban'

export type TeamsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: TeamsStatusFilter
  onStatusFilterChange: (value: TeamsStatusFilter) => void
  sort: TeamsSortOption
  onSortChange: (value: TeamsSortOption) => void
  viewMode: TeamsViewMode
  onViewModeChange: (value: TeamsViewMode) => void
}

const statusFilterChips: { value: TeamsStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'needsMembers', label: 'Precisa de membros' },
  { value: 'complete', label: 'Completas' },
]

const sortOptions: Option[] = [{ value: 'name_asc', label: 'Nome' }]

export function TeamsToolbar(props: TeamsToolbarProps) {
  const selectedSort = sortOptions.find((option) => option.value === props.sort) ?? sortOptions[0]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] flex-1">
        <SearchInput
          placeholder="Buscar equipe ou coordenador..."
          value={props.search}
          onChange={props.onSearchChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {statusFilterChips.map((chip) => {
          const isActive = chip.value === props.statusFilter
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => props.onStatusFilterChange(chip.value)}
              aria-pressed={isActive}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer',
                isActive
                  ? 'border-dark-brown bg-dark-brown text-white'
                  : 'border-primary bg-white text-dark-brown hover:border-dark-brown'
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <div className="w-[180px]">
        <Selector
          options={sortOptions}
          selected={selectedSort}
          onChange={(option) => props.onSortChange(option.value as TeamsSortOption)}
          placeholder="Ordenar: Nome"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <ButtonIcon
          icon={<FiGrid />}
          ariaLabel="Visualizar em grade"
          variant={props.viewMode === 'grid' ? 'primary' : 'secondary'}
          onClick={() => props.onViewModeChange('grid')}
        />
        <ButtonIcon icon={<FiList />} ariaLabel="Visualizar em lista (em breve)" disabled />
        <ButtonIcon icon={<FiTrello />} ariaLabel="Visualizar em kanban (em breve)" disabled />
      </div>
    </div>
  )
}
