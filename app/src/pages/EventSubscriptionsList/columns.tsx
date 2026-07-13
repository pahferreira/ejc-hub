import { createColumnHelper } from '@tanstack/react-table'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'
import { ExperienceBadge } from '../../components/ExperienceBadge/ExperienceBadge'
import { SubscriptionStatusBadge } from '../../components/SubscriptionStatusBadge/SubscriptionStatusBadge'
import { TeamAvatar } from '../../components/TeamAvatar/TeamAvatar'

const columnHelper = createColumnHelper<SubscriptionWithDetails>()

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}

export const subscriptionColumns = [
  columnHelper.accessor('user.name', {
    id: 'subscriber',
    header: 'Nome',
    cell: (info) => (
      <div>
        <div className="font-medium text-gray-900">
          {info.row.original.user.nickname || info.getValue()}
        </div>
        <div className="text-sm text-gray-500">{info.getValue()}</div>
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
  columnHelper.accessor('user.experienceType', {
    id: 'experience',
    header: 'Experiência',
    cell: (info) => <ExperienceBadge experienceType={info.getValue()} />,
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: (info) => <SubscriptionStatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('teams', {
    id: 'teams',
    header: 'Equipes Selecionadas',
    cell: (info) => {
      const teams = info.getValue()

      return (
        <div className="flex space-x-1">
          {teams.map((team) => (
            <TeamAvatar key={team.id} name={team.name} />
          ))}
        </div>
      )
    },
    enableSorting: false,
  }),
]
