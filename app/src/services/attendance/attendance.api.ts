import { api } from '../api'
import type { CoordinatorAttendanceReadModel } from './attendance.types'

/**
 * The coordinator Reuniões read model for the caller's own team.
 *
 * The team is never sent: the API derives it from the caller's coordinator
 * membership and answers 403 for anyone else.
 */
async function getMyTeamAttendance() {
  const response = await api.get<CoordinatorAttendanceReadModel>('/attendance/my-team')
  return response.data
}

export const attendanceApi = {
  getMyTeamAttendance,
}
