import { AppError } from '../../../shared/AppError.ts'
import type { TeamTemplateRepository } from '../../team/domain/TeamTemplateRepository.ts'

export class ControlPanel {
  #teamTemplateRepository: TeamTemplateRepository

  constructor(teamTemplateRepo: TeamTemplateRepository) {
    this.#teamTemplateRepository = teamTemplateRepo
  }

  async createTeamTemplate(input: { description?: string; key: string; name: string }) {
    const teamTemplate = await this.#teamTemplateRepository.selectTeamTemplateByKey(input.key)

    if (teamTemplate) {
      throw new AppError('Team template key already in use.')
    }

    const result = await this.#teamTemplateRepository.insertTeamTemplate(input)

    if (!result) {
      throw new AppError('Failed to create team template.')
    }

    return result
  }

  async getTeamTemplateById(id: string) {
    const teamTemplate = await this.#teamTemplateRepository.selectTeamTemplateById(id)

    if (!teamTemplate) {
      throw new AppError('Team template not found, please check the team template id.')
    }

    return teamTemplate
  }

  async listTeamTemplates() {
    const teamTemplates = await this.#teamTemplateRepository.listTeamTemplates()
    return teamTemplates
  }

  async updateTeamTemplate(id: string, input: { description?: string; name?: string }) {
    const teamTemplateToUpdate = await this.#teamTemplateRepository.selectTeamTemplateById(id)

    if (!teamTemplateToUpdate) {
      throw new AppError('Team template not found, please check the team template id.')
    }

    const updatedTeamTemplate = await this.#teamTemplateRepository.updateTeamTemplate(id, input)
    return updatedTeamTemplate
  }

  async deleteTeamTemplate(id: string) {
    const deleted = await this.#teamTemplateRepository.deleteTeamTemplate(id)
    return deleted
  }
}
