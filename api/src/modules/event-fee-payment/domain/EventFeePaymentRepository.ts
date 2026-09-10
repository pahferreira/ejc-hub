import type { DbExecutor } from '../../../core/database/client.ts'
import type { SettableFeeStatus } from './fee-payment-status.ts'

export type SetFeePaymentsStatusInput = {
  eventId: string
  userIds: string[]
  status: SettableFeeStatus
  /** The user making the change, stored on the row as `recordedBy`. */
  recordedBy: string
  /** The event's current fee, snapshotted onto rows this call creates. */
  amountCents: number
  executor?: DbExecutor
}

/**
 * One team member of an event alongside the fee status stored for them, exactly
 * as the column holds it — `null` when no payment row exists yet.
 *
 * Deliberately not reduced to paid/pending here: folding is a presentation rule
 * (`toMemberFeeStanding`), and a repository that pre-folded would leave callers
 * unable to tell `exempt` from `paid` if a future screen needs to.
 */
export type MemberFeeStatusRow = {
  userId: string
  name: string
  /** Raw column value; may be null, in which case the caller falls back. */
  nickname: string | null
  phone: string | null
  pictureUrl: string | null
  experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
  /** Key of the person's circle (newbies only); null when unset. */
  circleKey: string | null
  membershipType: 'member' | 'coordinator'
  teamId: string
  teamKey: string
  teamName: string
  /** The stored `event_fee_payments.status`, or null when no row exists. */
  feeStatus: string | null
}

export interface EventFeePaymentRepository {
  /**
   * Sets the fee status for every given user in one event, creating the row when
   * none exists yet.
   *
   * Writes the full set of fields the status implies (see
   * `buildFeePaymentStatusFields`), never the status column alone.
   *
   * Idempotent: it upserts on the `(event_id, user_id)` unique constraint, so
   * re-applying a status a member already has is a no-op rather than a
   * duplicate-key error. That matters for the bulk route, where a stale client
   * can easily include someone who was just updated in another tab.
   *
   * A single statement, so the batch is atomic without an explicit transaction.
   *
   * Returns the user ids actually written, which is the honest answer to what
   * changed — the caller's requested list is only an intent.
   */
  setPaymentsStatus: (input: SetFeePaymentsStatusInput) => Promise<string[]>

  /**
   * Fee standing per team for one event.
   *
   * Driven from team instances rather than memberships so a team with nobody
   * assigned still reports a row (total 0) instead of vanishing from the
   * dashboard.
   *
   * `paid` folds `exempt` in with `paid`: a comped member owes nothing, so from
   * the coordination view they are settled. The distinction stays intact in the
   * column itself — this rollup is presentation, not storage.
   */
  aggregateFeeStatusByTeam: (eventId: string) => Promise<
    {
      teamId: string
      teamKey: string
      teamName: string
      total: number
      paid: number
    }[]
  >

  /**
   * Every person assigned to a team in one event, with the fee status stored for
   * them.
   *
   * Driven from memberships rather than team instances — the mirror image of
   * `aggregateFeeStatusByTeam` — because this list is about people: an empty team
   * contributes no rows, which is the correct answer for a member list.
   *
   * Coordinators are included: they owe the fee like everyone else, and the
   * per-team totals already count them.
   *
   * Returns the whole event unpaginated. Search, filtering and paging are applied
   * in `Financial`, matching how `Events.listCurrentEventSubscriptions` works, so
   * the aggregate counts and the page are derived from one consistent snapshot.
   */
  listMemberFeeStatus: (eventId: string) => Promise<MemberFeeStatusRow[]>
}
