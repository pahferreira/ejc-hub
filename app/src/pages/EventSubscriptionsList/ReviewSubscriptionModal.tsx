import { useState, useEffect } from 'react'
import { Modal } from '../../components/Modal/Modal'
import { Selector } from '../../components/Selector/Selector'
import type { Option } from '../../components/Selector/Selector'
import type { SubscriptionWithDetails, SubscriptionStatus } from './subscription.types'

type ReviewSubscriptionModalProps = {
  subscription: SubscriptionWithDetails | null
  open: boolean
  onClose: () => void
  onConfirm: (id: string, newStatus: SubscriptionStatus) => void
}

const statusOptions: Option[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Received', value: 'received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Waiting List', value: 'waiting_list' },
]

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function findStatusOption(status: SubscriptionStatus): Option {
  return statusOptions.find((opt) => opt.value === status) || statusOptions[0]
}

export function ReviewSubscriptionModal(props: ReviewSubscriptionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Option>(statusOptions[0])

  useEffect(() => {
    if (props.subscription) {
      setSelectedStatus(findStatusOption(props.subscription.status))
    }
  }, [props.subscription])

  if (!props.subscription) return null

  const handleConfirm = () => {
    props.onConfirm(props.subscription!.id, selectedStatus.value as SubscriptionStatus)
  }

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
          <p className="text-sm text-gray-900">{props.subscription.teams.join(', ')}</p>
        </div>

        <div>
          <Selector
            label="Status"
            options={statusOptions}
            selected={selectedStatus}
            onChange={setSelectedStatus}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="bg-blue-500 text-white font-bold rounded-md text-center capitalize cursor-pointer w-auto px-6 py-2.5 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  )
}
