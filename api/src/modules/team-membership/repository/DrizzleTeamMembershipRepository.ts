import { and, asc, eq, inArray, ne } from 'drizzle-orm'
import { db, type DbExecutor } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  MembershipContact,
  TeamCoordinator,
  TeamCoordinatorSummary,
  TeamMembershipRepository,
} from '../domain/TeamMembershipRepository.ts'

const COORDINATOR_TYPE = 'coordinator' as const
const MEMBER_TYPE = 'member' as const

class DrizzleTeamMembershipRepository implements TeamMembershipRepository {
  async insertTeamMembership(
    input: { userId: string; teamInstanceId: string },
    executor: DbExecutor = db
  ) {
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
      .where(
        and(
          inArray(schema.teamMemberships.teamInstanceId, teamInstanceIds),
          eq(schema.teamMemberships.type, MEMBER_TYPE)
        )
      )

    for (const row of rows) {
      const userIds = membershipsByTeam.get(row.teamInstanceId) ?? []
      userIds.push(row.userId)
      membershipsByTeam.set(row.teamInstanceId, userIds)
    }

    return membershipsByTeam
  }

  async getCoordinatorUserIds(teamInstanceId: string) {
    const rows = await db
      .select({ userId: schema.teamMemberships.userId })
      .from(schema.teamMemberships)
      .where(
        and(
          eq(schema.teamMemberships.teamInstanceId, teamInstanceId),
          eq(schema.teamMemberships.type, COORDINATOR_TYPE)
        )
      )
      .orderBy(asc(schema.teamMemberships.createdAt))

    return rows.map((row) => row.userId)
  }

  async setCoordinators(
    teamInstanceId: string,
    coordinatorUserIds: string[],
    executor: DbExecutor = db
  ) {
    await executor
      .delete(schema.teamMemberships)
      .where(
        and(
          eq(schema.teamMemberships.teamInstanceId, teamInstanceId),
          eq(schema.teamMemberships.type, COORDINATOR_TYPE)
        )
      )

    if (coordinatorUserIds.length === 0) {
      return
    }

    await executor.insert(schema.teamMemberships).values(
      coordinatorUserIds.map((userId) => ({
        userId,
        teamInstanceId,
        type: COORDINATOR_TYPE,
      }))
    )
  }

  async listTeamCoordinators(teamInstanceId: string): Promise<TeamCoordinator[]> {
    const rows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
      })
      .from(schema.teamMemberships)
      .innerJoin(schema.users, eq(schema.teamMemberships.userId, schema.users.id))
      .where(
        and(
          eq(schema.teamMemberships.teamInstanceId, teamInstanceId),
          eq(schema.teamMemberships.type, COORDINATOR_TYPE)
        )
      )
      .orderBy(asc(schema.teamMemberships.createdAt))

    return rows
  }

  async listCoordinatorIdsByTeamInstanceIds(teamInstanceIds: string[]) {
    const coordinatorIdsByTeam = new Map<string, string[]>()

    if (teamInstanceIds.length === 0) {
      return coordinatorIdsByTeam
    }

    const rows = await db
      .select({
        teamInstanceId: schema.teamMemberships.teamInstanceId,
        userId: schema.teamMemberships.userId,
      })
      .from(schema.teamMemberships)
      .where(
        and(
          inArray(schema.teamMemberships.teamInstanceId, teamInstanceIds),
          eq(schema.teamMemberships.type, COORDINATOR_TYPE)
        )
      )
      .orderBy(asc(schema.teamMemberships.createdAt))

    for (const row of rows) {
      const coordinatorIds = coordinatorIdsByTeam.get(row.teamInstanceId) ?? []
      coordinatorIds.push(row.userId)
      coordinatorIdsByTeam.set(row.teamInstanceId, coordinatorIds)
    }

    return coordinatorIdsByTeam
  }

  async listCoordinatorExperienceByUserIds(userIds: string[], excludeEventId?: string) {
    const experienceByUser = new Map<string, string[]>()

    if (userIds.length === 0) {
      return experienceByUser
    }

    const rows = await db
      .select({
        userId: schema.teamMemberships.userId,
        templateName: schema.teamTemplates.name,
      })
      .from(schema.teamMemberships)
      .innerJoin(
        schema.teamInstances,
        eq(schema.teamMemberships.teamInstanceId, schema.teamInstances.id)
      )
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(
        and(
          eq(schema.teamMemberships.type, COORDINATOR_TYPE),
          inArray(schema.teamMemberships.userId, userIds),
          excludeEventId ? ne(schema.teamInstances.eventId, excludeEventId) : undefined
        )
      )

    for (const row of rows) {
      const teams = experienceByUser.get(row.userId) ?? []
      if (!teams.includes(row.templateName)) {
        teams.push(row.templateName)
      }
      experienceByUser.set(row.userId, teams)
    }

    return experienceByUser
  }

  async listCoordinatorsByTeamInstanceIds(teamInstanceIds: string[]) {
    const coordinatorsByTeam = new Map<string, TeamCoordinatorSummary[]>()

    if (teamInstanceIds.length === 0) {
      return coordinatorsByTeam
    }

    const rows = await db
      .select({
        teamInstanceId: schema.teamMemberships.teamInstanceId,
        id: schema.users.id,
        name: schema.users.name,
        pictureUrl: schema.users.pictureUrl,
      })
      .from(schema.teamMemberships)
      .innerJoin(schema.users, eq(schema.teamMemberships.userId, schema.users.id))
      .where(
        and(
          inArray(schema.teamMemberships.teamInstanceId, teamInstanceIds),
          eq(schema.teamMemberships.type, COORDINATOR_TYPE)
        )
      )
      .orderBy(asc(schema.teamMemberships.createdAt))

    for (const row of rows) {
      const coordinators = coordinatorsByTeam.get(row.teamInstanceId) ?? []
      coordinators.push({ id: row.id, name: row.name, pictureUrl: row.pictureUrl })
      coordinatorsByTeam.set(row.teamInstanceId, coordinators)
    }

    return coordinatorsByTeam
  }

  async deleteMembershipsByUserAndEvent(
    userId: string,
    eventId: string,
    executor: DbExecutor = db
  ) {
    await executor
      .delete(schema.teamMemberships)
      .where(
        and(
          eq(schema.teamMemberships.userId, userId),
          inArray(
            schema.teamMemberships.teamInstanceId,
            db
              .select({ id: schema.teamInstances.id })
              .from(schema.teamInstances)
              .where(eq(schema.teamInstances.eventId, eventId))
          )
        )
      )
  }

  async listEventMembershipContacts(eventId: string): Promise<MembershipContact[]> {
    const rows = await db
      .select({
        userId: schema.users.id,
        name: schema.users.name,
        nickname: schema.users.nickname,
        phone: schema.users.phone,
        instagram: schema.users.instagram,
        email: schema.users.email,
        type: schema.teamMemberships.type,
        teamInstanceId: schema.teamMemberships.teamInstanceId,
        teamName: schema.teamTemplates.name,
      })
      .from(schema.teamMemberships)
      .innerJoin(
        schema.teamInstances,
        eq(schema.teamMemberships.teamInstanceId, schema.teamInstances.id)
      )
      .innerJoin(schema.users, eq(schema.teamMemberships.userId, schema.users.id))
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(eq(schema.teamInstances.eventId, eventId))
      .orderBy(asc(schema.users.name), asc(schema.users.id))

    return rows
  }
}

export const teamMembershipRepository = new DrizzleTeamMembershipRepository()
