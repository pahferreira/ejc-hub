import { isAxiosError } from 'axios'
import { api } from '../api'
import type {
  CoordinatorAttendanceReadModel,
  MemberAttendanceReadModel,
  RegisterMeetingBody,
  RegisterMeetingResult,
  UpdateMeetingBody,
  UpdateMeetingResult,
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
 * The caller's own attendance record on their team. The API answers 403 for
 * anyone without a membership in the current event.
 */
async function getMyAttendance() {
  const response = await api.get<MemberAttendanceReadModel>('/attendance/me')
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

const UPDATE_MEETING_ERROR = 'Erro ao salvar reunião'

/**
 * Edits a meeting on the caller's own team. A 422 means the form is stale, as
 * on register; a 403 means the meeting is gone or no longer the caller's.
 */
async function updateMeeting(params: { meetingId: string; body: UpdateMeetingBody }) {
  try {
    const response = await api.put<{ result: UpdateMeetingResult }>(
      `/attendance/meetings/${params.meetingId}`,
      params.body
    )

    return response.data.result
  } catch (error: unknown) {
    if (isAxiosError(error) && [403, 422].includes(error.response?.status ?? 0)) {
      throw new Error(`${UPDATE_MEETING_ERROR}. Atualize a página e tente novamente.`)
    }
    throw new Error(UPDATE_MEETING_ERROR)
  }
}

/** Hard-deletes a meeting on the caller's own team, rows and all. */
async function deleteMeeting(meetingId: string) {
  try {
    await api.delete(`/attendance/meetings/${meetingId}`)
  } catch {
    throw new Error('Erro ao excluir reunião')
  }
}

export const attendanceApi = {
  getMyTeamAttendance,
  getMyAttendance,
  registerMeeting,
  updateMeeting,
  deleteMeeting,
}
