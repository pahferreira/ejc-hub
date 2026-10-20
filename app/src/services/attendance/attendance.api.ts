import { isAxiosError } from 'axios'
import { api } from '../api'
import type { ApiError } from '../general/error'
import type {
  CoordinatorAttendanceReadModel,
  RegisterMeetingBody,
  RegisterMeetingResult,
} from './attendance.types'

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

/**
 * Registers a meeting on the caller's own team. The drawer validates first, so
 * a 422 here is a stale form; its API message is surfaced as is.
 */
async function registerMeeting(body: RegisterMeetingBody) {
  try {
    const response = await api.post<{ result: RegisterMeetingResult }>('/attendance/meetings', body)

    return response.data.result
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      throw new Error((error as ApiError).response.data?.message ?? 'Erro ao registrar reunião')
    }
    throw new Error('Erro ao registrar reunião')
  }
}

export const attendanceApi = {
  getMyTeamAttendance,
  registerMeeting,
}
