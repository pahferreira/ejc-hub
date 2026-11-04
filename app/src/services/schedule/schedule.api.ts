import { isAxiosError } from 'axios'
import { api } from '../api'
import type { ApiError } from '../general/error'
import type {
  CreateScheduleActivityBody,
  CreateScheduleActivityResult,
  CreateScheduleDayBody,
  CreateScheduleDayResult,
  ScheduleReadModel,
} from './schedule.types'

const NO_CURRENT_EVENT_CODE = 'no_current_event'

/**
 * Whether a failed schedule read means there is no current event, which the
 * page explains rather than showing the generic "could not load".
 */
export function isNoCurrentEventError(error: unknown): boolean {
  return isAxiosError(error) && (error as ApiError).response?.data?.code === NO_CURRENT_EVENT_CODE
}

/** The current event's days, earliest first. */
async function getSchedule() {
  const response = await api.get<ScheduleReadModel>('/schedule')
  return response.data
}

const CREATE_DAY_ERROR = 'Erro ao criar dia'

// The modal only offers free dates inside the event, so these mean the form is
// stale (another admin added the day) or the date was typed by hand.
const createDayErrorByStatus: Record<number, string> = {
  400: 'A data precisa estar dentro das datas do encontro.',
  409: 'Este dia já está no cronograma.',
}

/** Adds a day on a date of the current event. */
async function createDay(body: CreateScheduleDayBody) {
  try {
    const response = await api.post<{ result: CreateScheduleDayResult }>('/schedule/days', body)

    return response.data.result
  } catch (error: unknown) {
    const status = isAxiosError(error) ? (error.response?.status ?? 0) : 0
    throw new Error(createDayErrorByStatus[status] ?? CREATE_DAY_ERROR)
  }
}

/**
 * The message the API's validation codes become on the form. The core refuses a
 * plan for one of a few reasons; each gets its own pt-BR line.
 */
const CREATE_ACTIVITY_ERROR = 'Não foi possível adicionar a atividade.'

const createActivityMessageByCode: Record<string, string> = {
  validation: 'Confira o horário e os responsáveis: pode haver sobreposição ou falta alguém.',
  not_found: 'Este dia não existe mais. Recarregue a página.',
}

/**
 * The error the activity form shows. Carries the pt-BR message so the form can
 * render it inline near its buttons.
 */
export class CreateActivityError extends Error {}

/** Adds an activity to a day of the current event. */
async function createActivity(body: CreateScheduleActivityBody) {
  try {
    const response = await api.post<{ result: CreateScheduleActivityResult }>(
      '/schedule/activities',
      body
    )

    return response.data.result
  } catch (error: unknown) {
    const code = isAxiosError(error) ? ((error as ApiError).response?.data?.code ?? '') : ''
    throw new CreateActivityError(createActivityMessageByCode[code] ?? CREATE_ACTIVITY_ERROR)
  }
}

/** Hard-deletes a day and every activity on it. */
async function deleteDay(dayId: string) {
  try {
    await api.delete(`/schedule/days/${dayId}`)
  } catch {
    throw new Error('Erro ao excluir dia')
  }
}

export const scheduleApi = {
  getSchedule,
  createDay,
  createActivity,
  deleteDay,
}
