import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ControlPanel } from './ControlPanel.ts'
import type { TeamTemplateRepository } from '../../../modules/team-template/domain/TeamTemplateRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'

const TEAM_TEMPLATE_ID = 'team-template-1'

describe('ControlPanel.updateTeamTemplate', () => {
  let teamTemplateRepository: TeamTemplateRepository
  let eventRepository: EventRepository
  let teamInstanceRepository: TeamInstanceRepository
  let controlPanel: ControlPanel

  beforeEach(() => {
    teamTemplateRepository = {
      selectTeamTemplateById: vi
        .fn()
        .mockResolvedValue({ id: TEAM_TEMPLATE_ID, name: 'Cozinha', maxCapacity: 0 }),
      updateTeamTemplate: vi
        .fn()
        .mockResolvedValue({ id: TEAM_TEMPLATE_ID, name: 'Cozinha', maxCapacity: 12 }),
    } as unknown as TeamTemplateRepository

    eventRepository = {} as unknown as EventRepository
    teamInstanceRepository = {} as unknown as TeamInstanceRepository

    controlPanel = new ControlPanel(teamTemplateRepository, eventRepository, teamInstanceRepository)
  })

  it('passes maxCapacity through to the repository update', async () => {
    await controlPanel.updateTeamTemplate(TEAM_TEMPLATE_ID, { maxCapacity: 12 })

    expect(teamTemplateRepository.updateTeamTemplate).toHaveBeenCalledWith(
      TEAM_TEMPLATE_ID,
      expect.objectContaining({ maxCapacity: 12 })
    )
  })

  it('returns the updated team template', async () => {
    const result = await controlPanel.updateTeamTemplate(TEAM_TEMPLATE_ID, { maxCapacity: 12 })

    expect(result).toEqual(expect.objectContaining({ maxCapacity: 12 }))
  })

  it('throws when the team template does not exist', async () => {
    teamTemplateRepository.selectTeamTemplateById = vi.fn().mockResolvedValue(undefined)

    await expect(
      controlPanel.updateTeamTemplate(TEAM_TEMPLATE_ID, { maxCapacity: 12 })
    ).rejects.toThrow('Team template not found, please check the team template id.')

    expect(teamTemplateRepository.updateTeamTemplate).not.toHaveBeenCalled()
  })
})
