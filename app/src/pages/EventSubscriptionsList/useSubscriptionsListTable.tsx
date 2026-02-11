import { useState, useMemo } from 'react'
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { SubscriptionWithDetails } from './subscription.types'
import type { Option } from '../../components/MultiSelector/MultiSelector'
import { Badge } from '../../components/Badge/Badge'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const columnHelper = createColumnHelper<SubscriptionWithDetails>()

const statusVariantMap = {
  pending: 'pending',
  received: 'approved',
  completed: 'completed',
  waiting_list: 'waiting_list',
} as const

const statusLabelMap: Record<string, string> = {
  pending: 'Pending',
  received: 'Approved',
  completed: 'Completed',
  waiting_list: 'Waiting List',
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

const columns = [
  columnHelper.accessor('user.name', {
    id: 'subscriber',
    header: 'Subscriber',
    cell: (info) => (
      <div>
        <div className="font-medium text-gray-900">{info.getValue()}</div>
        <div className="text-sm text-gray-500">{info.row.original.user.email}</div>
      </div>
    ),
  }),
  columnHelper.accessor('user.phone', {
    id: 'phone',
    header: 'Phone',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('teams', {
    id: 'teams',
    header: 'Selected Teams',
    cell: (info) => {
      const teams = info.getValue()
      if (teams.length === 0) return '-'
      return (
        <div className="flex flex-wrap gap-1">
          {teams.map((team) => (
            <Badge key={team}>{team}</Badge>
          ))}
        </div>
      )
    },
    enableSorting: false,
  }),
  columnHelper.accessor('createdAt', {
    id: 'submitted',
    header: 'Submitted',
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      return <Badge variant={statusVariantMap[status]}>{statusLabelMap[status] || status}</Badge>
    },
  }),
]

export function useSubscriptionsListTable(subscriptions: SubscriptionWithDetails[]) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<Option[]>([])
  const debouncedSearch = useDebouncedValue(searchValue)

  const teamOptions: Option[] = useMemo(() => {
    const uniqueTeams = new Set<string>()
    subscriptions.forEach((sub) => sub.teams.forEach((team) => uniqueTeams.add(team)))
    return Array.from(uniqueTeams).map((team) => ({ label: team, value: team }))
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
          subscription.teams.some((team) => selectedTeams.some((t) => t.value === team))

        return matchesSearch && matchesTeams
      }),
    [subscriptions, debouncedSearch, selectedTeams],
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
