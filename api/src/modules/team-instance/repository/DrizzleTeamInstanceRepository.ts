import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../../core/database/client.ts'
import { schema } from '../../../core/database/schemas/index.ts'
import type {
  AssignedTeamForUser,
  TeamCoordinator,
  TeamCoordinatorSummary,
  TeamInstanceRepository,
} from '../domain/TeamInstanceRepository.ts'

class DrizzleTeamInstanceRepository implements TeamInstanceRepository {
  async insertTeamInstance(input: { templateId: string; eventId: string }) {
    const result = await db
      .insert(schema.teamInstances)
      .values({
        templateId: input.templateId,
        eventId: input.eventId,
      })
      .returning()

    return result[0]
  }

  async listTeamInstances(eventId?: string, queryParams?: { keys?: string[] }) {
    const results = await db
      .select({
        id: schema.teamInstances.id,
        eventId: schema.teamInstances.eventId,
        name: schema.teamTemplates.name,
        templateKey: schema.teamTemplates.key,
      })
      .from(schema.teamInstances)
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(
        and(
          eventId ? eq(schema.teamInstances.eventId, eventId) : undefined,
          queryParams?.keys ? inArray(schema.teamTemplates.key, queryParams.keys) : undefined
        )
      )

    return results
  }

  async listTeamInstancesWithDetails(eventId: string) {
    return db
      .select({
        id: schema.teamInstances.id,
        eventId: schema.teamInstances.eventId,
        templateKey: schema.teamTemplates.key,
        templateName: schema.teamTemplates.name,
        templateDescription: schema.teamTemplates.description,
        maxCapacity: schema.teamTemplates.maxCapacity,
      })
      .from(schema.teamInstances)
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(eq(schema.teamInstances.eventId, eventId))
  }

  async listCoordinatorIdsByTeamInstanceIds(teamInstanceIds: string[]) {
    const coordinatorIdsByTeam = new Map<string, string[]>()

    if (teamInstanceIds.length === 0) {
      return coordinatorIdsByTeam
    }

    const instances = await db
      .select({
        id: schema.teamInstances.id,
        firstCoordinatorId: schema.teamInstances.firstCoordinatorId,
        secondCoordinatorId: schema.teamInstances.secondCoordinatorId,
        thirdCoordinatorId: schema.teamInstances.thirdCoordinatorId,
      })
      .from(schema.teamInstances)
      .where(inArray(schema.teamInstances.id, teamInstanceIds))

    for (const instance of instances) {
      const coordinatorIds = [
        instance.firstCoordinatorId,
        instance.secondCoordinatorId,
        instance.thirdCoordinatorId,
      ].filter((id): id is string => id !== null)

      if (coordinatorIds.length > 0) {
        coordinatorIdsByTeam.set(instance.id, coordinatorIds)
      }
    }

    return coordinatorIdsByTeam
  }

  async listCoordinatorsByTeamInstanceIds(teamInstanceIds: string[]) {
    const coordinatorsByTeam = new Map<string, TeamCoordinatorSummary[]>()
    const coordinatorIdsByTeam = await this.listCoordinatorIdsByTeamInstanceIds(teamInstanceIds)

    const coordinatorIds = [...coordinatorIdsByTeam.values()].flat()

    if (coordinatorIds.length === 0) {
      return coordinatorsByTeam
    }

    const users = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(inArray(schema.users.id, coordinatorIds))

    const usersById = new Map(users.map((user) => [user.id, user]))

    for (const [teamInstanceId, ids] of coordinatorIdsByTeam) {
      const coordinators = ids
        .map((id) => usersById.get(id))
        .filter((user): user is TeamCoordinatorSummary => user !== undefined)

      if (coordinators.length > 0) {
        coordinatorsByTeam.set(teamInstanceId, coordinators)
      }
    }

    return coordinatorsByTeam
  }

  async findUserTeamForEvent(
    userId: string,
    eventId: string
  ): Promise<AssignedTeamForUser | undefined> {
    const teamRows = await db
      .select({
        id: schema.teamInstances.id,
        name: schema.teamTemplates.name,
        description: schema.teamTemplates.description,
      })
      .from(schema.teamMemberships)
      .innerJoin(
        schema.teamInstances,
        eq(schema.teamMemberships.teamInstanceId, schema.teamInstances.id)
      )
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))
      .where(
        and(eq(schema.teamMemberships.userId, userId), eq(schema.teamInstances.eventId, eventId))
      )
      .limit(1)

    return teamRows[0]
  }

  async listTeamCoordinators(teamInstanceId: string): Promise<TeamCoordinator[]> {
    const teamInstance = await db
      .select({
        firstCoordinatorId: schema.teamInstances.firstCoordinatorId,
        secondCoordinatorId: schema.teamInstances.secondCoordinatorId,
      })
      .from(schema.teamInstances)
      .where(eq(schema.teamInstances.id, teamInstanceId))
      .limit(1)

    const row = teamInstance[0]
    if (!row) {
      return []
    }

    const coordinatorIds = [row.firstCoordinatorId, row.secondCoordinatorId].filter(
      (id): id is string => id !== null
    )

    if (coordinatorIds.length === 0) {
      return []
    }

    const coordinators = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
      })
      .from(schema.users)
      .where(inArray(schema.users.id, coordinatorIds))

    return coordinatorIds
      .map((id) => coordinators.find((coordinator) => coordinator.id === id))
      .filter((coordinator): coordinator is TeamCoordinator => coordinator !== undefined)
  }

  async selectTeamInstance(id: string) {
    const result = await db
      .select({
        id: schema.teamInstances.id,
        description: schema.teamTemplates.description,
        eventId: schema.teamInstances.eventId,
        name: schema.teamTemplates.name,
        templateKey: schema.teamTemplates.key,
      })
      .from(schema.teamInstances)
      .where(eq(schema.teamInstances.id, id))
      .innerJoin(schema.teamTemplates, eq(schema.teamInstances.templateId, schema.teamTemplates.id))

    return result[0]
  }

  async deleteTeamInstance(id: string) {
    const deleted = await db
      .delete(schema.teamInstances)
      .where(eq(schema.teamInstances.id, id))
      .returning()

    return deleted[0]
  }

  async updateTeamInstance(
    id: string,
    input: { firstCoordinatorId?: string | null; secondCoordinatorId?: string | null }
  ) {
    const updated = await db
      .update(schema.teamInstances)
      .set(input)
      .where(eq(schema.teamInstances.id, id))
      .returning()

    return updated[0]
  }

  async bulkInsertTeamInstances(eventId: string, templateIds: string[]) {
    const teamInstancesToInsert = templateIds.map((id) => ({
      eventId,
      templateId: id,
    }))
    const teams = await db.insert(schema.teamInstances).values(teamInstancesToInsert).returning()
    return teams
  }
}

export const teamInstanceRepository = new DrizzleTeamInstanceRepository()
