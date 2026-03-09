import { Modal } from '../../components/Modal/Modal'
import { Badge } from '../../components/Badge/Badge'
import type {
  SubscriptionWithDetails,
  SubscriptionStatus,
} from '../../services/subscriptions/subscriptions.types'

type ReviewSubscriptionModalProps = {
  subscription: SubscriptionWithDetails | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string) => void
  onWaitList: (id: string) => void
}

const statusVariantMap = {
  pending: 'pending',
  received: 'approved',
  completed: 'completed',
  waiting_list: 'waiting_list',
} as const

const statusLabelMap: Record<SubscriptionStatus, string> = {
  pending: 'Pendente',
  received: 'Recebida',
  completed: 'Montado',
  waiting_list: 'Lista de Espera',
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function ReviewSubscriptionModal(props: ReviewSubscriptionModalProps) {
  if (!props.subscription) return null

  const status = props.subscription.status

  return (
    <Modal open={props.open} onClose={props.onClose} title="Review Subscription">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Nome</p>
            <p className="text-sm text-gray-900">{props.subscription.user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
            <p className="text-sm text-gray-900">{props.subscription.user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Telefone</p>
            <p className="text-sm text-gray-900">{props.subscription.user.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Data de Criação</p>
            <p className="text-sm text-gray-900">{formatDate(props.subscription.createdAt)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Equipes Escolhidas</p>
          <p className="text-sm text-gray-900">
            {props.subscription.teams.map((t) => t.name).join(', ')}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
          <Badge variant={statusVariantMap[status]}>{statusLabelMap[status]}</Badge>
        </div>

        {status !== 'completed' && (
          <div className="flex flex-col gap-3">
            {(status === 'pending' || status === 'waiting_list') && (
              <button
                onClick={() => props.onConfirm(props.subscription!.id)}
                className="bg-blue-500 text-white font-bold rounded-md text-center capitalize cursor-pointer w-auto px-6 py-2.5 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Confirmar Recebimento
              </button>
            )}
            {(status === 'pending' || status === 'received') && (
              <button
                onClick={() => props.onWaitList(props.subscription!.id)}
                className="bg-gray-500 text-white font-bold rounded-md text-center capitalize cursor-pointer w-auto px-6 py-2.5 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Mover para Lista de Espera
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
