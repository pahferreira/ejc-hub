import { MemberRequest } from '../core/MemberRequest.ts'
import { memberRequestRepository } from '../../../modules/member-request/repository/DrizzleMemberRequestRepository.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { subscriptionRepository } from '../../../modules/subscription/repository/DrizzleSubscriptionRepository.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'

// Repositories only. Placing an approved member and listing eligible
// subscribers are team building's rules, and this feature reaches them through
// `placeMembers` / `listTeamCandidates` — parameterized core helpers it hands
// these same repositories to — never through team building's wired app object.
export const memberRequestApp = new MemberRequest(
  memberRequestRepository,
  eventRepository,
  subscriptionRepository,
  teamInstanceRepository,
  teamMembershipRepository,
  userRepository
)
