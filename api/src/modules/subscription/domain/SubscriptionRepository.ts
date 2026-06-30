import { SubscriptionInput, SubscriptionModel } from '../../../core/database/schemas/index.ts'
import type { DbExecutor } from '../../../core/database/client.ts'
import type { SubscriptionStatus } from './subscription.types.ts'

export interface SubscriptionRepository {
  insertSubscription: (input: SubscriptionInput) => Promise<SubscriptionModel | undefined>
  getSubscription: (id: string) => Promise<SubscriptionModel | undefined>
  listSubscriptions: () => Promise<SubscriptionModel[]>
  listSubscriptionsByEventId: (eventId: string) => Promise<
    {
      id: string
      userId: string
      status: SubscriptionStatus
      createdAt: Date
      teams: string[]
      user: {
        name: string
        nickname: string | null
        email: string
        phone: string | null
        experienceType: 'newbie' | 'experienced' | 'experienced_outsider'
        hasActingSkills: boolean
        hasCommunicationSkills: boolean
        hasCookingSkills: boolean
        hasDancingSkills: boolean
        hasManualSkills: boolean
        hasMusicSkills: boolean
        hasSingingSkills: boolean
      }
    }[]
  >
  getSubscriptionByUserAndEvent: (
    userId: string,
    eventId: string
  ) => Promise<SubscriptionModel | undefined>
  updateSubscriptionStatus: (
    id: string,
    status: SubscriptionStatus,
    executor?: DbExecutor
  ) => Promise<SubscriptionModel | undefined>
  countSubscriptionsByStatusForEvent: (
    eventId: string
  ) => Promise<Record<SubscriptionStatus, number>>
}
