import { describe, it, expect, vi, beforeEach } from 'vitest'

// The service renders a real PDF via pdfkit, which is irrelevant to its own
// business logic (grouping, dedupe, normalization). Stub it so specs assert on
// the report model instead of parsing PDF bytes.
vi.mock('./render-call-campaign-pdf.ts', () => ({
  renderCallCampaignPdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}))

import { CallCampaignService } from './CallCampaignService.ts'
import { renderCallCampaignPdf } from './render-call-campaign-pdf.ts'
import type { EventModel } from '../../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../../modules/event/domain/EventRepository.ts'
import type {
  MembershipContact,
  TeamMembershipRepository,
} from '../../../../modules/team-membership/domain/TeamMembershipRepository.ts'

const EVENT: EventModel = {
  id: 'event-1',
  name: 'EJC 2026',
} as EventModel

function buildContact(overrides: Partial<MembershipContact>): MembershipContact {
  return {
    userId: 'user-x',
    name: 'Member',
    nickname: null,
    phone: null,
    instagram: null,
    email: 'member@example.com',
    type: 'member',
    teamInstanceId: 'team-instance-1',
    teamName: 'Cozinha',
    ...overrides,
  }
}

describe('CallCampaignService', () => {
  let teamMembershipRepository: TeamMembershipRepository
  let eventRepository: EventRepository
  let service: CallCampaignService

  beforeEach(() => {
    vi.mocked(renderCallCampaignPdf).mockClear()

    teamMembershipRepository = {
      listEventMembershipContacts: vi.fn().mockResolvedValue([]),
    } as unknown as TeamMembershipRepository

    eventRepository = {
      findCurrentEvent: vi.fn().mockResolvedValue(EVENT),
    } as unknown as EventRepository

    service = new CallCampaignService(teamMembershipRepository, eventRepository)
  })

  it('throws when there is no current event', async () => {
    eventRepository.findCurrentEvent = vi.fn().mockResolvedValue(undefined)

    await expect(service.generatePdf()).rejects.toThrow('Current event not set')
  })

  it('throws when there are zero coordinators', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([buildContact({ userId: 'u1', name: 'Ana', type: 'member' })])

    await expect(service.generatePdf()).rejects.toThrow(
      'Nenhum coordenador definido para o evento atual'
    )
  })

  it('splits callees into as many groups as there are coordinators, sorted by name', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([
        buildContact({ userId: 'c1', name: 'Bruno Coord', type: 'coordinator' }),
        buildContact({ userId: 'c2', name: 'Ana Coord', type: 'coordinator' }),
        buildContact({ userId: 'm1', name: 'Carla Member', type: 'member' }),
        buildContact({ userId: 'm2', name: 'Daniel Member', type: 'member' }),
      ])

    await service.generatePdf()

    const report = vi.mocked(renderCallCampaignPdf).mock.calls[0][0]

    expect(report.groups).toHaveLength(2)
    // Coordinators sorted by name: Ana before Bruno.
    expect(report.groups[0].coordinator.name).toBe('Ana Coord')
    expect(report.groups[1].coordinator.name).toBe('Bruno Coord')
    expect(report.totalContacts).toBe(2)
    expect(report.groups.flatMap((g) => g.contacts)).toHaveLength(2)
  })

  it('produces leading empty groups when there are fewer callees than coordinators', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([
        buildContact({ userId: 'c1', name: 'Ana Coord', type: 'coordinator' }),
        buildContact({ userId: 'c2', name: 'Bruno Coord', type: 'coordinator' }),
        buildContact({ userId: 'c3', name: 'Carla Coord', type: 'coordinator' }),
        buildContact({ userId: 'm1', name: 'Daniel Member', type: 'member' }),
      ])

    await service.generatePdf()

    const report = vi.mocked(renderCallCampaignPdf).mock.calls[0][0]

    expect(report.groups).toHaveLength(3)
    expect(report.groups[0].contacts).toHaveLength(0)
    expect(report.groups[1].contacts).toHaveLength(0)
    expect(report.groups[2].contacts).toHaveLength(1)
  })

  it('produces a group per coordinator with zero contacts when there are no members', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([buildContact({ userId: 'c1', name: 'Ana Coord', type: 'coordinator' })])

    await service.generatePdf()

    const report = vi.mocked(renderCallCampaignPdf).mock.calls[0][0]

    expect(report.groups).toHaveLength(1)
    expect(report.groups[0].contacts).toHaveLength(0)
    expect(report.totalContacts).toBe(0)
  })

  it('dedupes a coordinator who coordinates two teams, keeping the first occurrence', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi.fn().mockResolvedValue([
      buildContact({
        userId: 'c1',
        name: 'Ana Coord',
        type: 'coordinator',
        teamInstanceId: 'team-a',
        teamName: 'Cozinha',
      }),
      buildContact({
        userId: 'c1',
        name: 'Ana Coord',
        type: 'coordinator',
        teamInstanceId: 'team-b',
        teamName: 'Limpeza',
      }),
    ])

    await service.generatePdf()

    const report = vi.mocked(renderCallCampaignPdf).mock.calls[0][0]

    expect(report.groups).toHaveLength(1)
    expect(report.groups[0].coordinator.teamName).toBe('Cozinha')
  })

  it.each([
    ['https://instagram.com/amandarbc', '@amandarbc'],
    ['http://www.instagram.com/amandarbc/', '@amandarbc'],
    ['@amandarbc', '@amandarbc'],
    ['amandarbc', '@amandarbc'],
    ['  amandarbc  ', '@amandarbc'],
    ['', null],
    ['   ', null],
  ])('normalizes instagram %s -> %s', async (raw, expected) => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([
        buildContact({ userId: 'c1', name: 'Ana Coord', type: 'coordinator' }),
        buildContact({ userId: 'm1', name: 'Member', type: 'member', instagram: raw }),
      ])

    await service.generatePdf()

    const report = vi.mocked(renderCallCampaignPdf).mock.calls[0][0]

    expect(report.groups[0].contacts[0].instagram).toBe(expected)
  })

  it('returns the pdf buffer and a filename from the mocked renderer', async () => {
    teamMembershipRepository.listEventMembershipContacts = vi
      .fn()
      .mockResolvedValue([buildContact({ userId: 'c1', name: 'Ana Coord', type: 'coordinator' })])

    const result = await service.generatePdf()

    expect(result.buffer).toEqual(Buffer.from('pdf'))
    expect(result.filename).toMatch(/^campanha-ligacoes-ejc-2026-\d{4}-\d{2}-\d{2}\.pdf$/)
  })
})
