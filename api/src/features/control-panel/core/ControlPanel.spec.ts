import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ControlPanel } from './ControlPanel.ts'
import type { TeamTemplateRepository } from '../../../modules/team-template/domain/TeamTemplateRepository.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { TeamInstanceRepository } from '../../../modules/team-instance/domain/TeamInstanceRepository.ts'
import type { CircleRepository } from '../../../modules/circle/domain/CircleRepository.ts'
import type { CallCampaignService } from '../services/call-campaign/CallCampaignService.ts'

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

    controlPanel = new ControlPanel(
      teamTemplateRepository,
      eventRepository,
      teamInstanceRepository,
      {} as CircleRepository,
      {} as CallCampaignService
    )
  })

  it('passes maxCapacity through to the repository update', async () => {
    await controlPanel.updateTeamTemplate(TEAM_TEMPLATE_ID, { maxCapacity: 12 })

    expect(teamTemplateRepository.updateTeamTemplate).toHaveBeenCalledWith(
      TEAM_TEMPLATE_ID,
      expect.objectContaining({ maxCapacity: 12 })
    )
  })

  it('passes maxAllowedCoordinators through to the repository update', async () => {
    await controlPanel.updateTeamTemplate(TEAM_TEMPLATE_ID, { maxAllowedCoordinators: 2 })

    expect(teamTemplateRepository.updateTeamTemplate).toHaveBeenCalledWith(
      TEAM_TEMPLATE_ID,
      expect.objectContaining({ maxAllowedCoordinators: 2 })
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

describe('ControlPanel.setEventSubscriptionMode', () => {
  const EVENT_ID = 'event-1'
  let eventRepository: EventRepository
  let controlPanel: ControlPanel

  beforeEach(() => {
    eventRepository = {
      findEvent: vi.fn().mockResolvedValue({ id: EVENT_ID, subscriptionMode: 'open' }),
      updateEvent: vi.fn().mockResolvedValue({ id: EVENT_ID, subscriptionMode: 'closed' }),
    } as unknown as EventRepository

    controlPanel = new ControlPanel(
      {} as TeamTemplateRepository,
      eventRepository,
      {} as TeamInstanceRepository,
      {} as CircleRepository,
      {} as CallCampaignService
    )
  })

  it('updates the event subscription mode with the provided value', async () => {
    await controlPanel.setEventSubscriptionMode(EVENT_ID, 'closed')

    expect(eventRepository.updateEvent).toHaveBeenCalledWith(EVENT_ID, {
      subscriptionMode: 'closed',
    })
  })

  it('accepts waiting-list mode, which keeps signups open but reroutes them', async () => {
    await controlPanel.setEventSubscriptionMode(EVENT_ID, 'waiting_list')

    expect(eventRepository.updateEvent).toHaveBeenCalledWith(EVENT_ID, {
      subscriptionMode: 'waiting_list',
    })
  })

  it('returns the updated event', async () => {
    const result = await controlPanel.setEventSubscriptionMode(EVENT_ID, 'closed')

    expect(result).toEqual(expect.objectContaining({ subscriptionMode: 'closed' }))
  })

  it('throws when the event does not exist', async () => {
    eventRepository.findEvent = vi.fn().mockResolvedValue(undefined)

    await expect(controlPanel.setEventSubscriptionMode(EVENT_ID, 'closed')).rejects.toThrow(
      'Event not found, please check the event id.'
    )

    expect(eventRepository.updateEvent).not.toHaveBeenCalled()
  })
})

describe('ControlPanel.updateEvent', () => {
  const EVENT_ID = 'event-1'
  let eventRepository: EventRepository
  let controlPanel: ControlPanel

  beforeEach(() => {
    eventRepository = {
      findEvent: vi.fn().mockResolvedValue({ id: EVENT_ID }),
      updateEvent: vi.fn().mockResolvedValue({ id: EVENT_ID }),
    } as unknown as EventRepository

    controlPanel = new ControlPanel(
      {} as TeamTemplateRepository,
      eventRepository,
      {} as TeamInstanceRepository,
      {} as CircleRepository,
      {} as CallCampaignService
    )
  })

  it('passes the fee through to the repository', async () => {
    await controlPanel.updateEvent(EVENT_ID, { name: 'XVI EJC', feeAmountCents: 15000 })

    expect(eventRepository.updateEvent).toHaveBeenCalledWith(
      EVENT_ID,
      expect.objectContaining({ feeAmountCents: 15000 })
    )
  })

  it('passes a zero fee through so it can clear a previously set one', async () => {
    await controlPanel.updateEvent(EVENT_ID, { feeAmountCents: 0 })

    expect(eventRepository.updateEvent).toHaveBeenCalledWith(
      EVENT_ID,
      expect.objectContaining({ feeAmountCents: 0 })
    )
  })

  it('leaves the fee undefined when it is not part of the update', async () => {
    // drizzle's .set() skips undefined keys, so the column stays untouched.
    await controlPanel.updateEvent(EVENT_ID, { name: 'XVI EJC' })

    expect(eventRepository.updateEvent).toHaveBeenCalledWith(
      EVENT_ID,
      expect.objectContaining({ feeAmountCents: undefined })
    )
  })

  it('throws when the event does not exist', async () => {
    eventRepository.findEvent = vi.fn().mockResolvedValue(undefined)

    await expect(controlPanel.updateEvent(EVENT_ID, { feeAmountCents: 15000 })).rejects.toThrow(
      'Event not found, please check the event id.'
    )

    expect(eventRepository.updateEvent).not.toHaveBeenCalled()
  })
})
