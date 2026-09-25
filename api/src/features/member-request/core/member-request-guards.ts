import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import { MemberRequestStatus } from '../../../modules/member-request/domain/member-request-status.ts'
import type { MemberRequestRow } from '../../../modules/member-request/domain/MemberRequestRepository.ts'

/** What create-time validation knows about one person it was asked to request. */
export type RequestabilityCheck = {
  userId: string
  /** Subscribed to this event with a status other than `cancelled`. */
  hasActiveSubscription: boolean
  /** Already holds a `team_memberships` row in this event. */
  hasMembership: boolean
  /** This team already has a `pending` request for them. */
  hasOpenRequestOnTeam: boolean
}

/**
 * Whether a person can be asked for at all.
 *
 * Three independent reasons, checked in the order a coordinator would hit them,
 * each with its own message: "not subscribed", "already placed" and "you already
 * asked" are different facts and a single "cannot request this person" would
 * leave the coordinator guessing which.
 *
 * The open-request check duplicates the partial unique index on purpose. The
 * index is the real guarantee — it holds under concurrency, which this cannot —
 * but hitting it produces a driver error, not a sentence naming the person.
 */
export function assertRequestable(check: RequestabilityCheck): void {
  if (!check.hasActiveSubscription) {
    throw new AppError(`User ${check.userId} has no active subscription to the current event`)
  }

  if (check.hasMembership) {
    throw new AppError(`User ${check.userId} already belongs to a team in this event`)
  }

  if (check.hasOpenRequestOnTeam) {
    throw new AppError(`User ${check.userId} already has an open request from your team`)
  }
}

/**
 * The request a coordinator may withdraw, or a 403.
 *
 * Every failure is the same `Forbidden` with the same message, including "no
 * such request". That is deliberate and mirrors `Financial.#assertCoordinatesTargets`:
 * a distinct "not found" would let a coordinator discover which request ids
 * exist on other teams by probing this endpoint, and they have no business
 * learning that from here.
 *
 * `pending` is the only cancellable status — an answered request is history, and
 * re-stamping it would erase who answered it.
 */
export function assertCoordinatorCanCancel(
  request: MemberRequestRow | undefined,
  context: { eventId: string; teamInstanceId: string }
): MemberRequestRow {
  const forbidden = new AppError(
    'Cannot cancel a request that does not belong to your team',
    AppErrorCode.Forbidden
  )

  if (!request || request.eventId !== context.eventId) {
    throw forbidden
  }

  if (request.teamInstanceId !== context.teamInstanceId) {
    throw forbidden
  }

  if (request.status !== MemberRequestStatus.Pending) {
    throw new AppError('Only a pending request can be cancelled')
  }

  return request
}

/**
 * The request an admin may answer, or a 422.
 *
 * No team scoping, unlike the coordinator guard above: the route's permission is
 * the whole authorization rule, so an admin who reaches here may answer anything
 * in the current event. Only the event scope and the status are checked.
 *
 * Says "not found" plainly, because there is nothing to hide from someone who
 * can already list every request in the event.
 */
export function assertAdminCanResolve(
  request: MemberRequestRow | undefined,
  eventId: string
): MemberRequestRow {
  if (!request || request.eventId !== eventId) {
    throw new AppError('Member request not found in the current event')
  }

  if (request.status !== MemberRequestStatus.Pending) {
    throw new AppError('Only a pending request can be approved or denied')
  }

  return request
}
