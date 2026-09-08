import { Financial } from '../core/Financial.ts'
import { eventFeePaymentRepository } from '../../../modules/event-fee-payment/repository/DrizzleEventFeePaymentRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'

export const financialApp = new Financial(eventFeePaymentRepository, eventRepository)
