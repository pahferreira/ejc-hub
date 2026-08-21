import type { EventModel } from '../../../../core/database/schemas/index.ts'

export type CallContact = {
  userId: string
  name: string
  instagram: string | null
  phone: string | null
  email: string
}

export type CallGroup = {
  coordinator: CallContact & { teamName: string }
  contacts: CallContact[]
}

export type CallCampaignReport = {
  event: EventModel
  generatedAt: Date
  totalContacts: number
  groups: CallGroup[]
}
