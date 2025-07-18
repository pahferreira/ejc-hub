import { and, eq } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type { TeamMembershipRepository } from '../domain/TeamMembershipRepository.ts'

class DrizzleTeamMembershipRepository implements TeamMembershipRepository {
  async insertTeamMembership(input: { userId: string; teamInstanceId: string }) {
    const teamMemberships = await db.insert(schema.teamMemberships).values(input).returning()

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

  async deleteTeamMembership(id: string) {
    const results = await db
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
}

export const teamMembershipRepository = new DrizzleTeamMembershipRepository()
