import { teamRepository } from '../repository/DrizzleTeamRepository.ts'

class TeamTemplates {
  async createTeamTemplate(input: {
    description?: string
    key: string
    name: string
  }) {
    const teamTemplate = await teamRepository.getTeamTemplateByKey(input.key)

    if (teamTemplate) {
      throw new Error('Team template key already in use.')
    }

    const result = await teamRepository.insertTeamTemplate(input)
    return result
  }
}

export const teamTemplatesApp = new TeamTemplates()
