import { and, eq, inArray } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamMembershipRepository } from '../domain/TeamMembershipRepository.ts'

class DrizzleTeamMembershipRepository implements TeamMembershipRepository {
  async insertTeamMembership(input: { userId: string; teamInstanceId: string }, executor: DbExecutor = db) {
    const teamMemberships = await executor.insert(schema.teamMemberships).values(input).returning()

    return teamMemberships[0]
  }

  async selectTeamMembership(id: string) {
    const results = await db
      .select()
      .from(schema.teamMemberships)
      .where(eq(schema.teamMemberships.id, id))
      .limit(1)

    return results[0]
  }

  async listTeamMemberships() {
    const results = await db.select().from(schema.teamMemberships)
    return results
  }

  async deleteTeamMembership(id: string, executor: DbExecutor = db) {
    const results = await executor
      .delete(schema.teamMemberships)
      .where(eq(schema.teamMemberships.id, id))
      .returning()
    return results[0]
  }

  async selectByMemberAndTeam(teamId: string, memberId: string) {
    const results = await db
      .select()
      .from(schema.teamMemberships)
      .where(
        and(
          eq(schema.teamMemberships.userId, memberId),
          eq(schema.teamMemberships.teamInstanceId, teamId)
        )
      )

    return results[0]
  }

  async deleteByMemberAndTeam(teamId: string, memberId: string, executor: DbExecutor = db) {
    const results = await executor
      .delete(schema.teamMemberships)
      .where(
        and(
          eq(schema.teamMemberships.userId, memberId),
          eq(schema.teamMemberships.teamInstanceId, teamId)
        )
      )
      .returning()

    return results[0]
  }

  async listMemberUserIdsByTeamInstanceIds(teamInstanceIds: string[]) {
    const membershipsByTeam = new Map<string, string[]>()

    if (teamInstanceIds.length === 0) {
      return membershipsByTeam
    }

    const rows = await db
      .select({
        teamInstanceId: schema.teamMemberships.teamInstanceId,
        userId: schema.teamMemberships.userId,
      })
      .from(schema.teamMemberships)
      .where(inArray(schema.teamMemberships.teamInstanceId, teamInstanceIds))

    for (const row of rows) {
      const userIds = membershipsByTeam.get(row.teamInstanceId) ?? []
      userIds.push(row.userId)
      membershipsByTeam.set(row.teamInstanceId, userIds)
    }

    return membershipsByTeam
  }
}

export const teamMembershipRepository = new DrizzleTeamMembershipRepository()
