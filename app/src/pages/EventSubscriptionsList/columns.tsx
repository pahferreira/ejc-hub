import { createColumnHelper } from '@tanstack/react-table'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'
import { Badge } from '../../components/Badge/Badge'
import { TeamAvatar } from '../../components/TeamAvatar/TeamAvatar'
import { experienceOptions, getOptionLabel } from '../EventSubscription/profileOptions'
import { subscriptionStatusDisplay } from '../../services/events/subscriptionStatusDisplay'
import type { SubscriptionStatus } from '../../services/events/events.types'

const columnHelper = createColumnHelper<SubscriptionWithDetails>()

// Note: Badge uses its own variant system ('pending' | 'received' | 'completed' | 'waiting_list')
// which differs from SubscriptionStatusDisplay variants ('pending' | 'success').
// We keep a separate map here for Badge display context.
const statusBadgeVariantMap: Record<
  SubscriptionStatus,
  'pending' | 'received' | 'completed' | 'waiting_list'
> = {
  pending: 'pending',
  received: 'received',
  completed: 'completed',
  waiting_list: 'waiting_list',
}

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
      return (
        <Badge variant={statusBadgeVariantMap[status]}>
          {subscriptionStatusDisplay[status].label}
        </Badge>
      )
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
            <TeamAvatar key={team.id} name={team.name} />
          ))}
        </div>
      )
    },
    enableSorting: false,
  }),
]
