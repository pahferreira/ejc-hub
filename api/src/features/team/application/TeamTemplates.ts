import z from 'zod/v4'
import type { TeamRepository } from '../domain/TeamRepository.ts'
import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

const updatePayloadSchema = z
  .object({
    description: z.string().optional(),
    name: z.string().optional(),
  })
  .refine((data) => {
    if (!data.description && !data.name) {
      return false
    }
    return true
  })

type UpdateInput = z.infer<typeof updatePayloadSchema>

class TeamTemplates {
  #teamRepository: TeamRepository

  constructor(teamRepository: TeamRepository) {
    this.#teamRepository = teamRepository
  }

  async createTeamTemplate(input: { description?: string; key: string; name: string }) {
    const teamTemplate = await this.#teamRepository.selectTeamTemplateByKey(input.key)

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

  async updateTeamTemplate(id: string, input: UpdateInput) {
    const isInputValid = updatePayloadSchema.safeParse(input).success

    if (!isInputValid) {
      throw new Error('At least one of the following attributes needs to be present: name, description')
    }

    const teamTemplateToUpdate = await this.#teamRepository.selectTeamTemplateById(id)

    if (!teamTemplateToUpdate) {
      throw new Error('Team template not found, please check the team template id.')
    }

    const updatedTeamTemplate = await this.#teamRepository.updateTeamTemplate(id, input)
    return updatedTeamTemplate
  }
}

export const teamTemplatesApp = new TeamTemplates(teamRepository)
