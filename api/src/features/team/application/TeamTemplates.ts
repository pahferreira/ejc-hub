import type { TeamRepository } from '../domain/TeamRepository.ts'
import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

class TeamTemplates {
  #teamRepository: TeamRepository

  constructor(teamRepository: TeamRepository) {
    this.#teamRepository = teamRepository
  }

  async createTeamTemplate(input: {
    description?: string
    key: string
    name: string
  }) {
    const teamTemplate = await this.#teamRepository.selectTeamTemplateByKey(
      input.key
    )

    if (teamTemplate) {
      throw new Error('Team template key already in use.')
    }

    const result = await this.#teamRepository.insertTeamTemplate(input)
    return result
  }

  async findOne(id: string) {
    const teamTemplate = await this.#teamRepository.selectTeamTemplateById(id)

    if (!teamTemplate) {
      return undefined
    }

    return teamTemplate
  }

  async listAll() {
    const teamTemplates = await this.#teamRepository.listTeamTemplates()
    return teamTemplates
  }
}

export const teamTemplatesApp = new TeamTemplates(teamRepository)
