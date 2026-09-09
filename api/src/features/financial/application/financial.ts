import { Financial } from '../core/Financial.ts'
import { eventFeePaymentRepository } from '../../../modules/event-fee-payment/repository/DrizzleEventFeePaymentRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'

export const financialApp = new Financial(
  eventFeePaymentRepository,
  eventRepository,
  teamMembershipRepository,
  userRepository
)
