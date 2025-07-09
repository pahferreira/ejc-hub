import type { TeamRepository } from '../domain/TeamRepository.ts'
import { AppError } from '../../../shared/AppError.ts'
export class TeamTemplate {
  #teamRepository: TeamRepository

  constructor(teamRepository: TeamRepository) {
    this.#teamRepository = teamRepository
  }

  async createTeamTemplate(input: { description?: string; key: string; name: string }) {
    const teamTemplate = await this.#teamRepository.selectTeamTemplateByKey(input.key)

    if (teamTemplate) {
      throw new AppError('Team template key already in use.')
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

  async updateTeamTemplate(id: string, input: { name?: string; description?: string }) {
    const teamTemplateToUpdate = await this.#teamRepository.selectTeamTemplateById(id)

    if (!teamTemplateToUpdate) {
      throw new AppError('Team template not found, please check the team template id.')
    }

    const updatedTeamTemplate = await this.#teamRepository.updateTeamTemplate(id, input)
    return updatedTeamTemplate
  }

  async deleteTeamTemplate(id: string) {
    const deleted = await this.#teamRepository.deleteTeamTemplate(id)
    return deleted
  }
}
