import { Schedule } from '../core/Schedule.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { scheduleDayRepository } from '../../../modules/schedule-day/repository/DrizzleScheduleDayRepository.ts'
import { scheduleActivityRepository } from '../../../modules/schedule-activity/repository/DrizzleScheduleActivityRepository.ts'
import { scheduleActivityTeamRepository } from '../../../modules/schedule-activity-team/repository/DrizzleScheduleActivityTeamRepository.ts'
import { teamInstanceRepository } from '../../../modules/team-instance/repository/DrizzleTeamInstanceRepository.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'

export const scheduleApp = new Schedule(
  eventRepository,
  scheduleDayRepository,
  scheduleActivityRepository,
  scheduleActivityTeamRepository,
  teamInstanceRepository,
  userRepository,
  teamMembershipRepository
)
