import { Modal } from '../../components/Modal/Modal'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { TeamAvatar } from '../../components/TeamAvatar/TeamAvatar'
import type {
  SubscriptionWithDetails,
  SubscriptionStatus,
} from '../../services/subscriptions/subscriptions.types'
import { formatDate } from '../../utils/formatDate/formatDate'
import { experienceOptions, getOptionLabel } from '../EventSubscription/profileOptions'

type ReviewSubscriptionModalProps = {
  subscription: SubscriptionWithDetails | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string) => void
  onWaitList: (id: string) => void
}

const statusVariantMap = {
  pending: 'pending',
  received: 'received',
  completed: 'completed',
  waiting_list: 'waiting_list',
} as const

const statusLabelMap: Record<SubscriptionStatus, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  completed: 'Concluído',
  waiting_list: 'Lista de Espera',
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
            <p className="text-sm font-medium text-gray-500 mb-1">Experiência</p>
            <p className="text-sm text-gray-900">
              {getOptionLabel(props.subscription.user.experienceType, experienceOptions)}
            </p>
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
            <p className="text-sm font-medium text-gray-500 mb-1">Data de Inscrição</p>
            <p className="text-sm text-gray-900">{formatDate(props.subscription.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
            <Badge variant={statusVariantMap[status]}>{statusLabelMap[status]}</Badge>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Equipes Escolhidas</p>
          <div className="flex space-x-1">
            {props.subscription.teams.map((team) => (
              <TeamAvatar key={team.id} name={team.name} />
            ))}
          </div>
        </div>

        {status !== 'completed' && (
          <div className="flex flex-col gap-3">
            {(status === 'pending' || status === 'waiting_list') && (
              <Button onClick={() => props.onConfirm(props.subscription!.id)}>
                Confirmar Recebimento
              </Button>
            )}
            {(status === 'pending' || status === 'received') && (
              <Button variant="secondary" onClick={() => props.onWaitList(props.subscription!.id)}>
                Mover para Lista de Espera
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
