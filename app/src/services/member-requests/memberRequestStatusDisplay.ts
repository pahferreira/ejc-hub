import type { BadgeVariant } from '../../components/Badge/Badge'

/** Mirrors the API's `MemberRequestStatus` (`member_request_status` enum). */
export type MemberRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'outdated'

export type MemberRequestStatusDisplay = {
  label: string
  variant: BadgeVariant
}

/**
 * pt-BR label and badge tone for every request status.
 *
 * No consumer in this slice — the coordinator page shows only counts, and the
 * admin queue (Phase H) is the first screen that renders individual statuses.
 * Built now anyway, since both screens need to agree on the same wording.
 *
 * `pending` reads "Aguardando", never "Pendente": that word already labels a
 * subscription status and an unpaid event fee, and would also read as the
 * existing "Lista de Espera" board column (Phase F).
 *
 * `outdated` reads "Sem efeito", never "negada": the system closed the request
 * because the person was placed elsewhere, nobody denied it.
 */
export const memberRequestStatusDisplay: Record<MemberRequestStatus, MemberRequestStatusDisplay> = {
  pending: { label: 'Aguardando', variant: 'warning' },
  approved: { label: 'Aprovada', variant: 'success' },
  denied: { label: 'Negada', variant: 'error' },
  cancelled: { label: 'Cancelada', variant: 'default' },
  outdated: { label: 'Sem efeito', variant: 'default' },
}
