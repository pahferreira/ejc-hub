import { useState, useMemo } from 'react'
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'
import type { Option } from '../../components/MultiSelector/MultiSelector'
import { Badge } from '../../components/Badge/Badge'
import { TeamAvatar } from '../../components/TeamAvatar/TeamAvatar'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { experienceOptions, getOptionLabel } from '../EventSubscription/profileOptions'

const columnHelper = createColumnHelper<SubscriptionWithDetails>()

const statusVariantMap = {
  pending: 'pending',
  received: 'received',
  completed: 'completed',
  waiting_list: 'waiting_list',
} as const

const statusLabelMap: Record<string, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  completed: 'Concluído',
  waiting_list: 'Lista de Espera',
}

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}

const columns = [
  columnHelper.accessor('user.name', {
    id: 'subscriber',
    header: 'Nome',
    cell: (info) => (
      <div>
        <div className="font-medium text-gray-900">{info.getValue()}</div>
        <div className="text-sm text-gray-500">
          {getOptionLabel(info.row.original.user.experienceType, experienceOptions)}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('user.phone', {
    id: 'phone',
    header: 'Contato',
    cell: (info) => (
      <div>
        <div className="text-gray-900">{info.getValue() || '-'}</div>
        <div className="text-sm text-gray-500">{info.row.original.user.email}</div>
      </div>
    ),
  }),
  columnHelper.accessor('createdAt', {
    id: 'submitted',
    header: 'Data',
    cell: (info) => formatShortDate(info.getValue()),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      return <Badge variant={statusVariantMap[status]}>{statusLabelMap[status] || status}</Badge>
    },
  }),
  columnHelper.accessor('teams', {
    id: 'teams',
    header: 'Equipes Selecionadas',
    cell: (info) => {
      const teams = info.getValue()

      return (
        <div className="flex space-x-1">
          {teams.map((team) => (
            <TeamAvatar name={team.name} />
          ))}
        </div>
      )
    },
    enableSorting: false,
  }),
]

export function useSubscriptionsListTable(subscriptions: SubscriptionWithDetails[]) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<Option[]>([])
  const debouncedSearch = useDebouncedValue(searchValue)

  const teamOptions: Option[] = useMemo(() => {
    const uniqueTeams = new Map<string, string>()
    subscriptions.forEach((sub) =>
      sub.teams.forEach((team) => uniqueTeams.set(team.name, team.name))
    )
    return Array.from(uniqueTeams.entries()).map(([name]) => ({ label: name, value: name }))
  }, [subscriptions])

  const filteredData = useMemo(
    () =>
      subscriptions.filter((subscription) => {
        const matchesSearch =
          !debouncedSearch ||
          subscription.user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          subscription.user.email.toLowerCase().includes(debouncedSearch.toLowerCase())

        const matchesTeams =
          selectedTeams.length === 0 ||
          subscription.teams.some((team) => selectedTeams.some((t) => t.value === team.name))

        return matchesSearch && matchesTeams
      }),
    [subscriptions, debouncedSearch, selectedTeams]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return {
    table,
    searchValue,
    setSearchValue,
    selectedTeams,
    setSelectedTeams,
    teamOptions,
  }
}
