import type { DbExecutor } from '../../../core/database/client.ts'
import type { EventFeePaymentModel } from '../../../core/database/schemas/index.ts'
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
   * The fee record of one person in one event, or `undefined` when none exists.
   *
   * At most one row by construction, not a first-of-many: the table is unique on
   * `(event_id, user_id)`.
   *
   * `undefined` is an ordinary answer rather than a miss — a row is only written
   * the first time someone records a status, so most people legitimately have
   * none. What that absence means for a fee is `toMemberFeeStanding`'s call, not
   * this method's, which is why the whole row comes back untranslated.
   *
   * Returns the record rather than a single column even though today's only
   * caller reads `status`. A point lookup on the unique index costs the same
   * either way, and a `findStatusBy...` would bake one caller's present appetite
   * into the data layer — the next screen wanting `method` or `paidAt` for a
   * receipt would have to widen it or add a near-duplicate. Mirrors
   * `getSubscriptionByUserAndEvent` on the sibling table, which has the same
   * `(event_id, user_id)` shape.
   */
  findPaymentByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<EventFeePaymentModel | undefined>

  /**
   * The stored fee status of many people in one event, keyed by user id.
   *
   * The batch answer to `findPaymentByUserAndEvent`, for callers holding a
   * roster: one statement for the whole list instead of a lookup per person,
   * which is what keeps a team-detail page load off an N+1.
   *
   * Users with no payment record are simply absent from the map rather than
   * present with a null. `Map.get` already returns `undefined` for them, which
   * `toMemberFeeStanding` reads as `pending` — so the caller folds missing and
   * recorded statuses through one path and cannot invent a third state for
   * "no row".
   *
   * Returns the raw column, not a folded standing: the fold is presentation
   * (`toMemberFeeStanding`), and pre-folding here would leave a caller unable to
   * tell `exempt` from `paid` if a future screen needs to.
   */
  listPaymentStatusesByUserIds: (eventId: string, userIds: string[]) => Promise<Map<string, string>>

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
      /** Members whose money actually came in; excludes the comped ones. */
      paid: number
      exempt: number
      /** Sum of the per-row `amount_cents` snapshots on paid rows. */
      collectedCents: number
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
