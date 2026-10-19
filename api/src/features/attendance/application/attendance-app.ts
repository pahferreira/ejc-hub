import { Attendance } from '../core/Attendance.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { userRepository } from '../../../modules/user/repository/DrizzleUserRepository.ts'
import { teamMembershipRepository } from '../../../modules/team-membership/repository/DrizzleTeamMembershipRepository.ts'
import { meetingRepository } from '../../../modules/meeting/repository/DrizzleMeetingRepository.ts'
import { meetingAttendanceRepository } from '../../../modules/meeting-attendance/repository/DrizzleMeetingAttendanceRepository.ts'

export const attendanceApp = new Attendance(
  eventRepository,
  userRepository,
  teamMembershipRepository,
  meetingRepository,
  meetingAttendanceRepository
)
