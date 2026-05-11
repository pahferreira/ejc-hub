import { FiDollarSign, FiTag, FiUserCheck } from 'react-icons/fi'
import { Badge } from '../Badge/Badge'
import { ProgressBar } from '../ProgressBar/ProgressBar'

type BadgeVariant = 'pending' | 'received' | 'completed' | 'waiting_list' | 'default'

type SubscriptionStatus = 'pending' | 'received' | 'completed' | 'waiting_list'
type PaymentStatus = 'paid' | 'pending' | 'not_required'
type ShirtStatus = 'paid' | 'pending' | 'not_requested'

export type InscriptionCardProps = {
  subscriptionStatus: SubscriptionStatus
  paymentStatus?: PaymentStatus
  shirtStatus?: ShirtStatus
  meetingAttendance?: { attended: number; total: number }
  spiritualityAttendance?: { attended: number; total: number }
}

const statusDisplay: Record<SubscriptionStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendente', variant: 'pending' },
  received: { label: 'Recebida', variant: 'received' },
  completed: { label: 'Aprovado', variant: 'completed' },
  waiting_list: { label: 'Lista de Espera', variant: 'waiting_list' },
}

const paymentDisplay: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: 'Pago', variant: 'completed' },
  pending: { label: 'Pendente', variant: 'pending' },
  not_required: { label: 'Não exigido', variant: 'default' },
}

const shirtDisplay: Record<ShirtStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: 'Paga', variant: 'completed' },
  pending: { label: 'Pendente', variant: 'pending' },
  not_requested: { label: 'Não solicitada', variant: 'default' },
}

export function InscriptionCard(props: InscriptionCardProps) {
  const status = statusDisplay[props.subscriptionStatus]
  const payment = props.paymentStatus ? paymentDisplay[props.paymentStatus] : null
  const shirt = props.shirtStatus ? shirtDisplay[props.shirtStatus] : null
  const hasSubStatusRows = Boolean(payment || shirt)
  const hasAttendanceRows = Boolean(props.meetingAttendance || props.spiritualityAttendance)

  return (
    <section className="overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <header className="flex items-center gap-2 bg-tertiary px-6 py-3">
        <FiUserCheck size={18} className="text-dark-brown" aria-hidden />
        <h3 className="m-0 font-serif text-lg text-dark-brown font-semibold">Sua Inscrição</h3>
      </header>

      <div className="flex flex-col gap-5 px-6 py-6">
        <div className="flex flex-col gap-1 mb-4">
          <span className="text-xs text-black font-semibold">Status da Inscrição</span>
          <div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        {hasSubStatusRows && (
          <>
            <hr className="m-0 border-t border-tertiary" />
            <div className="flex flex-col gap-3 py-4">
              {payment && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-black">
                    <FiDollarSign size={16} aria-hidden />
                    Taxa de Inscrição
                  </span>
                  <Badge variant={payment.variant}>{payment.label}</Badge>
                </div>
              )}
              {shirt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-black font-medium">
                    <FiTag size={16} aria-hidden />
                    Status da Camiseta
                  </span>
                  <Badge variant={shirt.variant}>{shirt.label}</Badge>
                </div>
              )}
            </div>
            <hr className="m-0 border-t border-tertiary" />
          </>
        )}

        {hasAttendanceRows && (
          <div className="flex flex-col gap-4 mt-4">
            {props.spiritualityAttendance && (
              <ProgressBar
                label="Presença em Espiritualidades"
                value={props.spiritualityAttendance.attended}
                max={props.spiritualityAttendance.total}
                variant="red"
                descriptionSuffix=" de presença"
              />
            )}
            {props.meetingAttendance && (
              <ProgressBar
                label="Presença em Reuniões"
                value={props.meetingAttendance.attended}
                max={props.meetingAttendance.total}
                variant="green"
                descriptionSuffix=" de presença"
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
