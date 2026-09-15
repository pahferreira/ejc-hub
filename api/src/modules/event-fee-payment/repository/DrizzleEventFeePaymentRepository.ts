import { and, asc, eq, inArray, sql } from 'drizzle-orm'
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
          // Re-prices only a row that was never priced.
          //
          // A row already carrying an amount keeps it: that is the snapshot this
          // column exists for, and changing someone's status must not silently
          // reprice them to today's event fee. But a row stamped 0 was written
          // while the event had no fee configured, and it is indistinguishable
          // from a real charge of nothing — so re-confirming that member is the
          // one moment we can correct it.
          //
          // The trade-off is deliberate: a member genuinely charged 0 under a
          // free event gets priced the moment someone re-confirms them. An
          // exemption, not a zero charge, is how a comped member is recorded.
          amountCents: sql`case when ${schema.eventFeePayments.amountCents} = 0 then excluded.amount_cents else ${schema.eventFeePayments.amountCents} end`,
        },
      })
      .returning({ userId: schema.eventFeePayments.userId })

    return rows.map((row) => row.userId)
  }

  async findPaymentByUserAndEvent(userId: string, eventId: string) {
    const result = await db
      .select()
      .from(schema.eventFeePayments)
      .where(
        and(
          eq(schema.eventFeePayments.userId, userId),
          eq(schema.eventFeePayments.eventId, eventId)
        )
      )

    return result[0]
  }

  async listPaymentStatusesByUserIds(eventId: string, userIds: string[]) {
    // No ids means no query: `inArray` with an empty list is a degenerate
    // predicate, and a roster can legitimately be empty (a team with nobody on
    // it yet).
    if (userIds.length === 0) {
      return new Map<string, string>()
    }

    const rows = await db
      .select({
        userId: schema.eventFeePayments.userId,
        status: schema.eventFeePayments.status,
      })
      .from(schema.eventFeePayments)
      .where(
        and(
          eq(schema.eventFeePayments.eventId, eventId),
          inArray(schema.eventFeePayments.userId, userIds)
        )
      )

    // At most one row per user by the `(event_id, user_id)` unique constraint,
    // so no key here can be overwritten by a later row.
    return new Map(rows.map((row) => [row.userId, row.status]))
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
          // Money-only, no longer folded with 'exempt': a comped member settles
          // their fee without contributing, and the treasurer's cards now count
          // the two separately so `collectedCents` and `paid` tell one story.
          paid: sql<number>`(count(*) filter (where ${schema.eventFeePayments.status} = 'paid'))::int`,
          exempt: sql<number>`(count(*) filter (where ${schema.eventFeePayments.status} = 'exempt'))::int`,
          // Summed from the per-row snapshot rather than the event's current fee:
          // `amount_cents` records what this person was actually charged, so a
          // mid-event fee change cannot retroactively rewrite what came in.
          collectedCents: sql<number>`(coalesce(sum(${schema.eventFeePayments.amountCents}) filter (where ${schema.eventFeePayments.status} = 'paid'), 0))::int`,
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
