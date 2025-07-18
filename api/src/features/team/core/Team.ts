import { AppError } from '../../../shared/AppError.ts'
import type { TeamInstanceRepository } from '../domain/TeamInstanceRepository.ts'
import { TeamMembershipRepository } from '../domain/TeamMembershipRepository.ts'
import { TeamTemplateRepository } from '../domain/TeamTemplateRepository.ts'

export class Team {
  #teamInstanceRepository: TeamInstanceRepository
  #teamTemplateRepository: TeamTemplateRepository
  #teamMembershipRepository: TeamMembershipRepository

  constructor(
    teamInstanceRepo: TeamInstanceRepository,
    teamTemplateRepo: TeamTemplateRepository,
    teamMembershipRepo: TeamMembershipRepository
  ) {
    this.#teamInstanceRepository = teamInstanceRepo
    this.#teamTemplateRepository = teamTemplateRepo
    this.#teamMembershipRepository = teamMembershipRepo
  }

  async listTeams(eventId?: string) {
    const teams = await this.#teamInstanceRepository.listTeamInstances(eventId)
    return teams
  }

  async listTeamOptions() {
    const teamOptions = await this.#teamTemplateRepository.listTeamTemplates()
    return teamOptions
  }

  async getTeam(teamId: string) {
    const team = await this.#teamInstanceRepository.selectTeamInstance(teamId)
    return team
  }

  async addMember(teamId: string, memberId: string) {
    const teamMembership = await this.#teamMembershipRepository.insertTeamMembership({
      teamInstanceId: teamId,
      userId: memberId,
    })

    return teamMembership
  }

  async removeMember(teamId: string, memberId: string) {
    const teamMembership = await this.#teamMembershipRepository.selectByMemberAndTeam(
      teamId,
      memberId
    )

    if (!teamMembership) {
      throw new AppError("This user doesn't make part of this team")
    }

    const removedTeamMembership = await this.#teamMembershipRepository.deleteTeamMembership(
      teamMembership.id
    )

    return removedTeamMembership
  }

  async assignCoordinators(
    teamId: string,
    input: { firstCoordId?: string; secondCoordId?: string }
  ) {
    if (input.firstCoordId) {
      const firstCoordMembershipExists = await this.#verifyCoordMembership(
        teamId,
        input.firstCoordId
      )
      if (!firstCoordMembershipExists) {
        throw new AppError('first coordinator must be member of the team')
      }
    }

    if (input.secondCoordId) {
      const secondCoordMembershipExists = await this.#verifyCoordMembership(
        teamId,
        input.secondCoordId
      )
      if (!secondCoordMembershipExists) {
        throw new AppError('second coordinator must be member of the team')
      }
    }

    const updatedTeam = await this.#teamInstanceRepository.updateTeamInstance(teamId, {
      firstCoordinatorId: input.firstCoordId,
      secondCoordinatorId: input.secondCoordId,
    })

    return updatedTeam
  }

  async #verifyCoordMembership(teamId: string, coordId: string) {
    const membership = await this.#teamMembershipRepository.selectByMemberAndTeam(teamId, coordId)

    return membership != null
  }
}
