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
}
