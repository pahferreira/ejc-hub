import { AppError } from '../../../shared/AppError.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { TeamMembershipRepository } from '../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { TeamTemplateRepository } from '../../../modules/team-template/domain/TeamTemplateRepository.ts'

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

}
