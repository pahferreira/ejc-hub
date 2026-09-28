/**
 * Every status a member request can hold, in lifecycle order.
 *
 * Mirrors the `member_request_status` enum exactly, which is what lets the admin
 * queue's status filter be derived from this list instead of restating it.
 */
export const MEMBER_REQUEST_STATUSES = [
  'pending',
  'approved',
  'denied',
  'cancelled',
  'outdated',
] as const

export type MemberRequestStatus = (typeof MEMBER_REQUEST_STATUSES)[number]

/**
 * The statuses an admin can set directly, from the queue's two buttons.
 *
 * `cancelled` is the coordinator's word and `outdated` is the system's, so
 * neither belongs here: an admin answering a request either says yes or says no.
 * The HTTP schema derives its enum from this list so the contract cannot drift
 * from the domain.
 */
export const SETTABLE_REQUEST_STATUSES = ['approved', 'denied'] as const

export type SettableRequestStatus = (typeof SETTABLE_REQUEST_STATUSES)[number]

export const MemberRequestStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Denied: 'denied',
  Cancelled: 'cancelled',
  Outdated: 'outdated',
} as const satisfies Record<string, MemberRequestStatus>

/**
 * Why the system closed a request when the person was placed elsewhere.
 *
 * Stored on an `outdated` row with a **null `resolved_by`** — that pairing is
 * the encoding of "nobody decided this". It is deliberately not `denied`: a
 * denial names the admin who made it, and nobody made this one. The coordinator
 * reads it as "Sem efeito", never "negada".
 */
export const OUTDATED_BY_ASSIGNMENT_REASON = 'Alocado em outra equipe'

/**
 * Why the system closed a request when the person's subscription was cancelled.
 *
 * Also system-written, so also a null `resolved_by`. A cancelled subscriber is
 * not coming, and a request for them left `pending` is one an admin could
 * approve into a membership for someone who will not show up.
 */
export const CANCELLED_BY_SUBSCRIPTION_REASON = 'Inscrição cancelada'
