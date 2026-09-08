import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { EventFeePaymentRepository } from '../domain/EventFeePaymentRepository.ts'

class DrizzleEventFeePaymentRepository implements EventFeePaymentRepository {
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
}

export const eventFeePaymentRepository = new DrizzleEventFeePaymentRepository()
