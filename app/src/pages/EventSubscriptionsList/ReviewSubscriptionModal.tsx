import { Modal } from '../../components/Modal/Modal'
import { Button } from '../../components/Button/Button'
import { SubscriptionStatusBadge } from '../../components/SubscriptionStatusBadge/SubscriptionStatusBadge'
import { TeamAvatar } from '../../components/TeamAvatar/TeamAvatar'
import type { SubscriptionWithDetails } from '../../services/subscriptions/subscriptions.types'
import { formatDate } from '../../utils/formatDate/formatDate'
import { experienceOptions, getOptionLabel, skills } from '../EventSubscription/profileOptions'

type ReviewSubscriptionModalProps = {
  subscription: SubscriptionWithDetails | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string) => void
  onWaitList: (id: string) => void
}

function formatInstagram(value: string) {
  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
  return handle ? `@${handle}` : ''
}

export function ReviewSubscriptionModal(props: ReviewSubscriptionModalProps) {
  if (!props.subscription) return null

  const status = props.subscription.status
  const instagram = props.subscription.user.instagram
    ? formatInstagram(props.subscription.user.instagram)
    : ''
  const selectedSkills = skills.filter((skill) => props.subscription!.user[skill.key])

  return (
    <Modal open={props.open} onClose={props.onClose} title="Revisar inscrição">
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
            <p className="text-sm text-gray-900 break-all">{props.subscription.user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Telefone</p>
            <p className="text-sm text-gray-900">{props.subscription.user.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Instagram</p>
            <p className="text-sm text-gray-900 break-all">{instagram || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Data de Inscrição</p>
            <p className="text-sm text-gray-900">{formatDate(props.subscription.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
            <SubscriptionStatusBadge status={status} />
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

        {selectedSkills.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Habilidades</p>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span
                  key={skill.key}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {props.subscription.details && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Detalhes</p>
            <p className="text-sm text-gray-900 whitespace-pre-line">
              {props.subscription.details}
            </p>
          </div>
        )}

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
