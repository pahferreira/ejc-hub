import type { StatusCardProps } from '../../components/StatusCard/StatusCard'
import type { SubscriptionStatus } from './events.types'

export type SubscriptionStatusDisplay = {
  label: string
  variant: StatusCardProps['variant']
  description: string
}

export const subscriptionStatusDisplay: Record<SubscriptionStatus, SubscriptionStatusDisplay> = {
  pending: {
    label: 'Pendente',
    variant: 'pending',
    description: 'Sua inscrição foi enviada e logo mais será confirmada.',
  },
  received: {
    label: 'Recebida',
    variant: 'success',
    description: 'Agora é com a gente! Aguarde o processo de montagem.',
  },
  completed: {
    label: 'Confirmada',
    variant: 'success',
    description: 'Você foi montado! Aguarde o contato de seu coordenador.',
  },
  waiting_list: {
    label: 'Lista de Espera',
    variant: 'pending',
    description: 'Você está na lista de espera.',
  },
}
