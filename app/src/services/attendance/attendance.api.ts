import { isAxiosError } from 'axios'
import { api } from '../api'
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

const REGISTER_MEETING_ERROR = 'Erro ao registrar reunião'

/**
 * Registers a meeting on the caller's own team.
 *
 * The drawer checks every rule first, so a 422 here means the form is stale
 * (the roster changed, or the client clock disagrees). The API's English
 * message isn't for the coordinator; a pt-BR hint to reload is.
 */
async function registerMeeting(body: RegisterMeetingBody) {
  try {
    const response = await api.post<{ result: RegisterMeetingResult }>('/attendance/meetings', body)

    return response.data.result
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 422) {
      throw new Error(`${REGISTER_MEETING_ERROR}. Atualize a página e tente novamente.`)
    }
    throw new Error(REGISTER_MEETING_ERROR)
  }
}

export const attendanceApi = {
  getMyTeamAttendance,
  registerMeeting,
}
