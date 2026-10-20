import { and, desc, eq, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  InsertMemberRequestInput,
  MemberRequestEventFilters,
  MemberRequestPerson,
  MemberRequestRepository,
  MemberRequestRow,
  OutdateOpenRequestsInput,
  ResolveMemberRequestsInput,
} from '../domain/MemberRequestRepository.ts'
import {
  CANCELLED_BY_SUBSCRIPTION_REASON,
  MemberRequestStatus,
  OUTDATED_BY_ASSIGNMENT_REASON,
} from '../domain/member-request-status.ts'

// Two self-joins on `users`, because one row names up to three people: the
// person being asked for, the coordinator who asked, and the admin who answered.
const requester = alias(schema.users, 'requester')
const resolver = alias(schema.users, 'resolver')

// The select every read shares, so the three list methods cannot drift into
// returning subtly different rows for the same table.
const requestColumns = {
  id: schema.memberRequests.id,
  status: schema.memberRequests.status,
  eventId: schema.memberRequests.eventId,
  teamInstanceId: schema.memberRequests.teamInstanceId,
  userId: schema.memberRequests.userId,
  userName: schema.users.name,
  userNickname: schema.users.nickname,
  userPictureUrl: schema.users.pictureUrl,
  userExperienceType: schema.users.experienceType,
  userCircleKey: schema.circles.key,
  requestedById: requester.id,
  requestedByName: requester.name,
  requestedByNickname: requester.nickname,
  message: schema.memberRequests.message,
  requestedAt: schema.memberRequests.createdAt,
  resolvedAt: schema.memberRequests.resolvedAt,
  resolvedById: resolver.id,
  resolvedByName: resolver.name,
  resolvedByNickname: resolver.nickname,
  resolutionReason: schema.memberRequests.resolutionReason,
}

function toRequestRow(row: {
  id: string
  status: string
  eventId: string
  teamInstanceId: string
  userId: string
  userName: string
  userNickname: string | null
  userPictureUrl: string | null
  userExperienceType: MemberRequestPerson['experienceType']
  userCircleKey: string | null
  requestedById: string | null
  requestedByName: string | null
  requestedByNickname: string | null
  message: string | null
  requestedAt: Date
  resolvedAt: Date | null
  resolvedById: string | null
  resolvedByName: string | null
  resolvedByNickname: string | null
  resolutionReason: string | null
}): MemberRequestRow {
  return {
    id: row.id,
    status: row.status as MemberRequestRow['status'],
    eventId: row.eventId,
    teamInstanceId: row.teamInstanceId,
    user: {
      userId: row.userId,
      name: row.userName,
      nickname: row.userNickname,
      pictureUrl: row.userPictureUrl,
      experienceType: row.userExperienceType,
      circleKey: row.userCircleKey,
    },
    requestedBy: {
      // `requested_by` is NOT NULL with a FK, so the inner join always matches;
      // the fallbacks only satisfy the column types.
      userId: row.requestedById ?? '',
      name: row.requestedByName ?? '',
      nickname: row.requestedByNickname,
    },
    message: row.message,
    requestedAt: row.requestedAt,
    resolvedAt: row.resolvedAt,
    // Null for `pending` (nobody answered) and for `outdated` (the system
    // closed it, and there is no admin to name).
    resolvedBy: row.resolvedById
      ? {
          userId: row.resolvedById,
          name: row.resolvedByName ?? '',
          nickname: row.resolvedByNickname,
        }
      : null,
    resolutionReason: row.resolutionReason,
  }
}

class DrizzleMemberRequestRepository implements MemberRequestRepository {
  // Reads hardcode `db`; only writes take an executor.
  #selectRequests() {
    return (
      db
        .select(requestColumns)
        .from(schema.memberRequests)
        .innerJoin(schema.users, eq(schema.memberRequests.userId, schema.users.id))
        // Left: only newbies have a circle.
        .leftJoin(schema.circles, eq(schema.circles.id, schema.users.circleId))
        .innerJoin(requester, eq(schema.memberRequests.requestedBy, requester.id))
        // Left, not inner: an unanswered or system-closed request has no resolver.
        .leftJoin(resolver, eq(schema.memberRequests.resolvedBy, resolver.id))
    )
  }

  async insertMemberRequests(inputs: InsertMemberRequestInput[], executor: DbExecutor = db) {
    // `insert ... values ()` is a syntax error, and "nobody was requested" is a
    // legitimate no-op rather than a failure.
    if (inputs.length === 0) {
      return []
    }

    const rows = await executor
      .insert(schema.memberRequests)
      .values(
        inputs.map((input) => ({
          userId: input.userId,
          teamInstanceId: input.teamInstanceId,
          eventId: input.eventId,
          requestedBy: input.requestedBy,
          message: input.message ?? null,
        }))
      )
      .returning({ id: schema.memberRequests.id })

    return rows.map((row) => row.id)
  }

  async getMemberRequest(id: string) {
    const rows = await this.#selectRequests().where(eq(schema.memberRequests.id, id))

    return rows[0] ? toRequestRow(rows[0]) : undefined
  }

  async listOpenRequestsByTeamAndUsers(teamInstanceId: string, userIds: string[]) {
    // `inArray` with an empty list is a degenerate predicate, and a request for
    // nobody is a legitimate call from a deduped-to-empty batch.
    if (userIds.length === 0) {
      return []
    }

    return db
      .select({
        id: schema.memberRequests.id,
        userId: schema.memberRequests.userId,
        teamInstanceId: schema.memberRequests.teamInstanceId,
      })
      .from(schema.memberRequests)
      .where(
        and(
          eq(schema.memberRequests.teamInstanceId, teamInstanceId),
          inArray(schema.memberRequests.userId, userIds),
          eq(schema.memberRequests.status, MemberRequestStatus.Pending)
        )
      )
  }

  async listRequestsByTeamInstance(teamInstanceId: string) {
    const rows = await this.#selectRequests()
      .where(eq(schema.memberRequests.teamInstanceId, teamInstanceId))
      // Tie-broken by id so paging is stable for two requests filed in the same
      // millisecond by a batch.
      .orderBy(desc(schema.memberRequests.createdAt), desc(schema.memberRequests.id))

    return rows.map(toRequestRow)
  }

  async listRequestsByEvent(eventId: string, filters: MemberRequestEventFilters = {}) {
    const statuses = filters.statuses
    const scope =
      statuses && statuses.length > 0
        ? and(
            eq(schema.memberRequests.eventId, eventId),
            inArray(schema.memberRequests.status, statuses)
          )
        : eq(schema.memberRequests.eventId, eventId)

    const rows = await this.#selectRequests()
      .where(scope)
      .orderBy(desc(schema.memberRequests.createdAt), desc(schema.memberRequests.id))

    return rows.map(toRequestRow)
  }

  async resolveRequests(input: ResolveMemberRequestsInput, executor: DbExecutor = db) {
    if (input.requestIds.length === 0) {
      return []
    }

    const rows = await executor
      .update(schema.memberRequests)
      .set({
        status: input.status,
        resolvedAt: input.resolvedAt,
        resolvedBy: input.resolvedBy,
        resolutionReason: input.resolutionReason ?? null,
        updatedAt: input.resolvedAt,
      })
      .where(
        and(
          inArray(schema.memberRequests.id, input.requestIds),
          // The compare half of a compare-and-set: a request already answered is
          // left exactly as it was, so a double-submit writes nothing rather
          // than restamping a decision nobody made twice.
          eq(schema.memberRequests.status, MemberRequestStatus.Pending)
        )
      )
      .returning({ id: schema.memberRequests.id })

    return rows.map((row) => row.id)
  }

  async outdateOpenRequestsForUsers(input: OutdateOpenRequestsInput, executor: DbExecutor = db) {
    if (input.userIds.length === 0) {
      return []
    }

    const now = new Date()

    const rows = await executor
      .update(schema.memberRequests)
      .set({
        status: MemberRequestStatus.Outdated,
        resolvedAt: now,
        // Null on purpose: `resolved_at` set with a null `resolved_by` is the
        // encoding of "the system closed this". A denial names the admin who
        // made it, and nobody made this one.
        resolvedBy: null,
        resolutionReason: OUTDATED_BY_ASSIGNMENT_REASON,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.memberRequests.eventId, input.eventId),
          inArray(schema.memberRequests.userId, input.userIds),
          eq(schema.memberRequests.status, MemberRequestStatus.Pending)
        )
      )
      .returning({ id: schema.memberRequests.id })

    return rows.map((row) => row.id)
  }

  async cancelOpenRequestsByUserAndEvent(
    userId: string,
    eventId: string,
    executor: DbExecutor = db
  ) {
    const now = new Date()

    const rows = await executor
      .update(schema.memberRequests)
      .set({
        status: MemberRequestStatus.Cancelled,
        resolvedAt: now,
        // System-written, so no resolver — see `outdateOpenRequestsForUsers`.
        resolvedBy: null,
        resolutionReason: CANCELLED_BY_SUBSCRIPTION_REASON,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.memberRequests.userId, userId),
          eq(schema.memberRequests.eventId, eventId),
          eq(schema.memberRequests.status, MemberRequestStatus.Pending)
        )
      )
      .returning({ id: schema.memberRequests.id })

    return rows.map((row) => row.id)
  }
}

export const memberRequestRepository = new DrizzleMemberRequestRepository()
