import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  SetFeePaymentsStatusInput,
  EventFeePaymentRepository,
  MemberFeeStatusRow,
} from '../domain/EventFeePaymentRepository.ts'
import { buildFeePaymentStatusFields } from '../domain/fee-payment-status.ts'

class DrizzleEventFeePaymentRepository implements EventFeePaymentRepository {
  async setPaymentsStatus(input: SetFeePaymentsStatusInput) {
    if (input.userIds.length === 0) {
      return []
    }

    // One timestamp for the whole batch, so members updated together carry the
    // same `paidAt` instead of drifting by a few milliseconds.
    const now = new Date()
    const executor = input.executor ?? db
    const statusFields = buildFeePaymentStatusFields(input.status, now)

    const rows = await executor
      .insert(schema.eventFeePayments)
      .values(
        input.userIds.map((userId) => ({
          eventId: input.eventId,
          userId,
          amountCents: input.amountCents,
          recordedBy: input.recordedBy,
          ...statusFields,
        }))
      )
      .onConflictDoUpdate({
        target: [schema.eventFeePayments.eventId, schema.eventFeePayments.userId],
        set: {
          recordedBy: input.recordedBy,
          updatedAt: now,
          ...statusFields,
          // `amountCents` is deliberately absent: an existing row already
          // snapshotted what this person was charged, and changing their status
          // must not silently reprice it to today's event fee.
        },
      })
      .returning({ userId: schema.eventFeePayments.userId })

    return rows.map((row) => row.userId)
  }

  async aggregateFeeStatusByTeam(eventId: string) {
    return (
      db
        .select({
          teamId: schema.teamInstances.id,
          teamKey: schema.teamTemplates.key,
          teamName: schema.teamTemplates.name,
          // Counts the membership id, not `*`: the left join leaves one all-null
          // row for a team with no members, which `count(*)` would score as 1.
          total: sql<number>`count(${schema.teamMemberships.id})::int`,
          paid: sql<number>`(count(*) filter (where ${schema.eventFeePayments.status} in ('paid', 'exempt')))::int`,
        })
        .from(schema.teamInstances)
        .innerJoin(
          schema.teamTemplates,
          eq(schema.teamInstances.templateId, schema.teamTemplates.id)
        )
        .leftJoin(
          schema.teamMemberships,
          eq(schema.teamMemberships.teamInstanceId, schema.teamInstances.id)
        )
        // Scoped to the instance's own event as well as the user: a person who
        // attended a previous event has a fee row there too.
        .leftJoin(
          schema.eventFeePayments,
          and(
            eq(schema.eventFeePayments.userId, schema.teamMemberships.userId),
            eq(schema.eventFeePayments.eventId, schema.teamInstances.eventId)
          )
        )
        .where(eq(schema.teamInstances.eventId, eventId))
        .groupBy(schema.teamInstances.id, schema.teamTemplates.key, schema.teamTemplates.name)
    )
  }

  async listMemberFeeStatus(eventId: string): Promise<MemberFeeStatusRow[]> {
    return (
      db
        .select({
          userId: schema.users.id,
          name: schema.users.name,
          nickname: schema.users.nickname,
          phone: schema.users.phone,
          pictureUrl: schema.users.pictureUrl,
          experienceType: schema.users.experienceType,
          circleKey: schema.circles.key,
          membershipType: schema.teamMemberships.type,
          teamId: schema.teamInstances.id,
          teamKey: schema.teamTemplates.key,
          teamName: schema.teamTemplates.name,
          feeStatus: schema.eventFeePayments.status,
        })
        .from(schema.teamMemberships)
        .innerJoin(schema.users, eq(schema.teamMemberships.userId, schema.users.id))
        .innerJoin(
          schema.teamInstances,
          eq(schema.teamMemberships.teamInstanceId, schema.teamInstances.id)
        )
        .innerJoin(
          schema.teamTemplates,
          eq(schema.teamInstances.templateId, schema.teamTemplates.id)
        )
        // Left, not inner: a newbie with no circle on file still belongs on the list.
        .leftJoin(schema.circles, eq(schema.users.circleId, schema.circles.id))
        // Scoped to the membership's own event as well as the user: a person who
        // attended a previous event has a fee row there too.
        .leftJoin(
          schema.eventFeePayments,
          and(
            eq(schema.eventFeePayments.userId, schema.teamMemberships.userId),
            eq(schema.eventFeePayments.eventId, schema.teamMemberships.eventId)
          )
        )
        // Filters the denormalized column rather than the instance's, so Postgres
        // can use the `(event_id, user_id)` unique index on team_memberships.
        .where(eq(schema.teamMemberships.eventId, eventId))
        // Tie-broken by id so paging is stable for two people sharing a name.
        .orderBy(asc(schema.users.name), asc(schema.users.id))
    )
  }
}

export const eventFeePaymentRepository = new DrizzleEventFeePaymentRepository()
