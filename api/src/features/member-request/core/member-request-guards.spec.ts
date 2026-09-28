import { describe, it, expect } from 'vitest'
import {
  assertAdminCanResolve,
  assertCoordinatorCanCancel,
  assertRequestable,
} from './member-request-guards.ts'
import { AppError, AppErrorCode } from '../../../shared/AppError.ts'
import type { MemberRequestRow } from '../../../modules/member-request/domain/MemberRequestRepository.ts'

function buildRequest(overrides: Partial<MemberRequestRow> = {}): MemberRequestRow {
  return {
    id: 'req-1',
    status: 'pending',
    eventId: 'event-1',
    teamInstanceId: 'team-a',
    user: { userId: 'user-1', name: 'Maria Silva', nickname: 'Mari', pictureUrl: null },
    requestedBy: { userId: 'coord-1', name: 'João Santos', nickname: null },
    message: null,
    requestedAt: new Date('2026-01-01'),
    resolvedAt: null,
    resolvedBy: null,
    resolutionReason: null,
    ...overrides,
  }
}

describe('assertRequestable', () => {
  const requestable = {
    userId: 'user-1',
    hasActiveSubscription: true,
    hasMembership: false,
    hasOpenRequestOnTeam: false,
  }

  it('accepts a subscribed person with no membership and no open request', () => {
    expect(() => assertRequestable(requestable)).not.toThrow()
  })

  it('rejects someone with no active subscription to the event', () => {
    expect(() => assertRequestable({ ...requestable, hasActiveSubscription: false })).toThrow(
      /no active subscription/
    )
  })

  it('rejects someone already placed on a team', () => {
    expect(() => assertRequestable({ ...requestable, hasMembership: true })).toThrow(
      /already belongs to a team/
    )
  })

  it('rejects a person this team has already asked for', () => {
    expect(() => assertRequestable({ ...requestable, hasOpenRequestOnTeam: true })).toThrow(
      /already has an open request from your team/
    )
  })

  it('reports the missing subscription before the membership, so the first true fact wins', () => {
    // Both are wrong here; the message must name one reason rather than the
    // last check to run.
    expect(() =>
      assertRequestable({
        ...requestable,
        hasActiveSubscription: false,
        hasMembership: true,
      })
    ).toThrow(/no active subscription/)
  })
})

describe('assertCoordinatorCanCancel', () => {
  const context = { eventId: 'event-1', teamInstanceId: 'team-a' }

  it("returns the request when it is the caller's team's pending request", () => {
    const request = buildRequest()

    expect(assertCoordinatorCanCancel(request, context)).toBe(request)
  })

  it("answers 403 for another team's request", () => {
    const request = buildRequest({ teamInstanceId: 'team-b' })

    try {
      assertCoordinatorCanCancel(request, context)
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
    }
  })

  it('answers the same 403 for an id that names nothing, revealing no existence', () => {
    // Deliberately indistinguishable from the team mismatch above: a distinct
    // "not found" would let a coordinator probe which request ids exist.
    const missing = (() => {
      try {
        assertCoordinatorCanCancel(undefined, context)
        return undefined
      } catch (error) {
        return error as AppError
      }
    })()
    const foreign = (() => {
      try {
        assertCoordinatorCanCancel(buildRequest({ teamInstanceId: 'team-b' }), context)
        return undefined
      } catch (error) {
        return error as AppError
      }
    })()

    expect(missing?.getMessage()).toBe(foreign?.getMessage())
    expect(missing?.getAppErrorCode()).toBe(foreign?.getAppErrorCode())
  })

  it('answers 403 for a request belonging to another event', () => {
    const request = buildRequest({ eventId: 'event-old' })

    try {
      assertCoordinatorCanCancel(request, context)
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AppError).getAppErrorCode()).toBe(AppErrorCode.Forbidden)
    }
  })

  it.each(['approved', 'denied', 'cancelled', 'outdated'] as const)(
    'refuses to cancel a request already %s',
    (status) => {
      expect(() => assertCoordinatorCanCancel(buildRequest({ status }), context)).toThrow(
        /Only a pending request can be cancelled/
      )
    }
  )
})

describe('assertAdminCanResolve', () => {
  it('returns the request when it is pending in the current event', () => {
    const request = buildRequest()

    expect(assertAdminCanResolve(request, 'event-1')).toBe(request)
  })

  it("does not scope to a team — any team's request is answerable", () => {
    const request = buildRequest({ teamInstanceId: 'some-other-team' })

    expect(assertAdminCanResolve(request, 'event-1')).toBe(request)
  })

  it('rejects an id that names nothing', () => {
    expect(() => assertAdminCanResolve(undefined, 'event-1')).toThrow(/not found/)
  })

  it('rejects a request from a previous event', () => {
    expect(() => assertAdminCanResolve(buildRequest({ eventId: 'event-old' }), 'event-1')).toThrow(
      /not found/
    )
  })

  it.each(['approved', 'denied', 'cancelled', 'outdated'] as const)(
    'refuses to answer a request already %s',
    (status) => {
      expect(() => assertAdminCanResolve(buildRequest({ status }), 'event-1')).toThrow(
        /Only a pending request can be approved or denied/
      )
    }
  )
})
