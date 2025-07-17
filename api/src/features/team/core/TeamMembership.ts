import { AppError } from '../../../shared/AppError.ts'
import { UserRepository } from '../../user/domain/UserRepository.ts'
import { TeamRepository } from '../domain/TeamRepository.ts'

export class TeamMembership {
  #teamRepository: TeamRepository
  #userRepository: UserRepository

  constructor(userRepo: UserRepository, teamRepo: TeamRepository) {
    this.#userRepository = userRepo
    this.#teamRepository = teamRepo
  }

  async createTeamMembership(input: { userId: string; teamId: string }) {
    const user = await this.#userRepository.getUser(input.userId)
    if (!user) {
      throw new AppError("user doesn't exist")
    }

    const teamInstance = await this.#teamRepository.selectTeamInstance(input.teamId)
    if (!teamInstance) {
      throw new AppError("Team doesn't exist")
    }

    const teamMembership = await this.#teamRepository.insertTeamMembership({
      userId: input.userId,
      teamInstanceId: input.teamId,
    })

    return teamMembership
  }

  async getTeamMembership(id: string) {
    const teamMembership = await this.#teamRepository.selectTeamMembership(id)
    return teamMembership
  }

  async listTeamMemberships() {
    const teamMemberships = await this.#teamRepository.listTeamMemberships()
    return teamMemberships
  }

  async deleteTeamMembership(id: string) {
    const deletedTeamMembership = await this.#teamRepository.deleteTeamMembership(id)
    return deletedTeamMembership
  }
}
