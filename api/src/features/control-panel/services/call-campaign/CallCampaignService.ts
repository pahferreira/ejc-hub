import { AppError } from '../../../../shared/AppError.ts'
import type { EventModel } from '../../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../../modules/event/domain/EventRepository.ts'
import type {
  MembershipContact,
  TeamMembershipRepository,
} from '../../../../modules/team-membership/domain/TeamMembershipRepository.ts'
import type { CallCampaignReport, CallContact, CallGroup } from './call-campaign.types.ts'
import { renderCallCampaignPdf } from './render-call-campaign-pdf.ts'
import { splitIntoGroups } from './split-into-groups.ts'

const INSTAGRAM_URL_PREFIX = /^https?:\/\/(www\.)?instagram\.com\//i

// Strips a leading instagram.com URL and/or "@", trims, then re-prefixes with "@".
// Matches the client-side rule in app/.../ReviewSubscriptionModal.tsx so the same
// handle renders the same way everywhere. Empty/whitespace-only values become null.
function normalizeInstagram(value: string | null): string | null {
  if (!value) return null

  const handle = value
    .trim()
    .replace(INSTAGRAM_URL_PREFIX, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
    .trim()

  return handle ? `@${handle}` : null
}

function toCallContact(row: MembershipContact): CallContact {
  return {
    userId: row.userId,
    name: row.name,
    instagram: normalizeInstagram(row.instagram),
    phone: row.phone,
    email: row.email,
  }
}

// Preserves the FIRST occurrence per userId — same pattern as `addMembers` in
// TeamBuilding.ts. The DB unique constraint is per-team, so a user coordinating
// two teams is not structurally prevented and must be deduped here.
function dedupeByUserId(rows: MembershipContact[]): MembershipContact[] {
  const seen = new Set<string>()
  const deduped: MembershipContact[] = []

  for (const row of rows) {
    if (seen.has(row.userId)) continue
    seen.add(row.userId)
    deduped.push(row)
  }

  return deduped
}

function byNameThenUserId(a: MembershipContact, b: MembershipContact): number {
  return a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId)
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildFilename(report: CallCampaignReport): string {
  const slug = slugify(report.event.name)
  return `campanha-ligacoes-${slug}-${formatDateForFilename(report.generatedAt)}.pdf`
}

export class CallCampaignService {
  #teamMembershipRepository: TeamMembershipRepository
  #eventRepository: EventRepository

  constructor(teamMembershipRepo: TeamMembershipRepository, eventRepo: EventRepository) {
    this.#teamMembershipRepository = teamMembershipRepo
    this.#eventRepository = eventRepo
  }

  async generatePdf(): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.#buildReport()
    return { buffer: await renderCallCampaignPdf(report), filename: buildFilename(report) }
  }

  // Resolves the current event once per call and hands it to `fn`. The id is a
  // call-scoped local, never cached on the instance.
  async #withCurrentEvent<T>(fn: (event: EventModel) => Promise<T>): Promise<T> {
    const currentEvent = await this.#eventRepository.findCurrentEvent()

    if (!currentEvent) {
      throw new AppError('Current event not set')
    }

    return fn(currentEvent)
  }

  async #buildReport(): Promise<CallCampaignReport> {
    return this.#withCurrentEvent(async (event) => {
      const rows = await this.#teamMembershipRepository.listEventMembershipContacts(event.id)

      const coordinators = dedupeByUserId(rows.filter((row) => row.type === 'coordinator')).sort(
        byNameThenUserId
      )
      const callees = rows.filter((row) => row.type === 'member').sort(byNameThenUserId)

      if (coordinators.length === 0) {
        throw new AppError('Nenhum coordenador definido para o evento atual')
      }

      const groups: CallGroup[] = splitIntoGroups(callees, coordinators.length).map(
        (contacts, index): CallGroup => ({
          coordinator: {
            ...toCallContact(coordinators[index]),
            teamName: coordinators[index].teamName,
          },
          contacts: contacts.map(toCallContact),
        })
      )

      return {
        event,
        generatedAt: new Date(),
        totalContacts: callees.length,
        groups,
      }
    })
  }
}
