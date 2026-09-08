import { AppError } from '../../../shared/AppError.ts'
import type { EventModel } from '../../../core/database/schemas/index.ts'
import type { EventRepository } from '../../../modules/event/domain/EventRepository.ts'
import type { EventFeePaymentRepository } from '../../../modules/event-fee-payment/domain/EventFeePaymentRepository.ts'
import type { EventFeeOverview } from '../domain/event-fee.types.ts'

function toPercentage(paid: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.round((paid / total) * 100)
}

export class Financial {
  #eventFeePaymentRepository: EventFeePaymentRepository
  #eventRepository: EventRepository

  constructor(eventFeePaymentRepo: EventFeePaymentRepository, eventRepo: EventRepository) {
    this.#eventFeePaymentRepository = eventFeePaymentRepo
    this.#eventRepository = eventRepo
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

  async getCurrentEventOverview(): Promise<EventFeeOverview> {
    return this.#withCurrentEvent(async (event) => {
      const rows = await this.#eventFeePaymentRepository.aggregateFeeStatusByTeam(event.id)

      const teams = rows
        .map((row) => ({
          teamId: row.teamId,
          teamKey: row.teamKey,
          teamName: row.teamName,
          total: row.total,
          paid: row.paid,
          // Everything that is not paid-or-exempt is outstanding, including
          // members with no payment row at all, so the two always sum to total.
          pending: row.total - row.paid,
          paidPercentage: toPercentage(row.paid, row.total),
        }))
        .sort((first, second) => first.teamName.localeCompare(second.teamName))

      // Summed from the team rows rather than queried again: every membership
      // belongs to exactly one team instance, so the totals agree by construction.
      const totalMembers = teams.reduce((sum, team) => sum + team.total, 0)
      const paidCount = teams.reduce((sum, team) => sum + team.paid, 0)

      return {
        totalMembers,
        paidCount,
        pendingCount: totalMembers - paidCount,
        paidPercentage: toPercentage(paidCount, totalMembers),
        teams,
      }
    })
  }
}
