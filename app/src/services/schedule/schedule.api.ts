import { isAxiosError } from 'axios'
import { api } from '../api'
import type { ApiError } from '../general/error'
import type {
  ScheduleActivityBody,
  CreateScheduleActivityResult,
  CreateScheduleDayBody,
  CreateScheduleDayResult,
  FinishScheduleActivityResult,
  ScheduleActivityControlBody,
  ScheduleReadModel,
  StartScheduleActivityResult,
  UpdateScheduleActivityLiveBody,
  UpdateScheduleActivityLiveResult,
  UpdateScheduleActivityResult,
  UpdateScheduleDayBody,
  UpdateScheduleDayResult,
} from './schedule.types'

const NO_CURRENT_EVENT_CODE = 'no_current_event'

/**
 * Whether a failed schedule read means there is no current event, which the
 * page explains rather than showing the generic "could not load".
 */
export function isNoCurrentEventError(error: unknown): boolean {
  return isAxiosError(error) && (error as ApiError).response?.data?.code === NO_CURRENT_EVENT_CODE
}

/**
 * Whether a failed schedule read means the caller is neither on a team in the
 * current event nor an admin, which the page explains rather than showing the
 * generic "could not load".
 */
export function isScheduleForbiddenError(error: unknown): boolean {
  return apiErrorStatus(error) === 403
}

/** The current event's days, earliest first. */
async function getSchedule() {
  const response = await api.get<ScheduleReadModel>('/schedule')
  return response.data
}

/** The HTTP status of a failed request, or 0 when it never got a response. */
function apiErrorStatus(error: unknown): number {
  return isAxiosError(error) ? (error.response?.status ?? 0) : 0
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
    throw new Error(createDayErrorByStatus[apiErrorStatus(error)] ?? CREATE_DAY_ERROR)
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

const UPDATE_ACTIVITY_ERROR = 'Não foi possível salvar a atividade.'

const updateActivityMessageByCode: Record<string, string> = {
  ...createActivityMessageByCode,
  not_found: 'Esta atividade não existe mais. Recarregue a página.',
}

const DELETE_ACTIVITY_ERROR = 'Não foi possível excluir a atividade.'

/**
 * The error the activity form shows. Carries the pt-BR message so the form can
 * render it inline near its buttons.
 */
export class ScheduleActivityError extends Error {}

/** The API's error code, or an empty string when the failure carried none. */
function apiErrorCode(error: unknown): string {
  return isAxiosError(error) ? ((error as ApiError).response?.data?.code ?? '') : ''
}

/** Adds an activity to a day of the current event. */
async function createActivity(body: ScheduleActivityBody) {
  try {
    const response = await api.post<{ result: CreateScheduleActivityResult }>(
      '/schedule/activities',
      body
    )

    return response.data.result
  } catch (error: unknown) {
    throw new ScheduleActivityError(
      createActivityMessageByCode[apiErrorCode(error)] ?? CREATE_ACTIVITY_ERROR
    )
  }
}

/** Edits an activity: every field is sent again, teams included. */
async function updateActivity(input: { activityId: string; body: ScheduleActivityBody }) {
  try {
    const response = await api.patch<{ result: UpdateScheduleActivityResult }>(
      `/schedule/activities/${input.activityId}`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw new ScheduleActivityError(
      updateActivityMessageByCode[apiErrorCode(error)] ?? UPDATE_ACTIVITY_ERROR
    )
  }
}

/** Hard-deletes an activity and its team links. */
async function deleteActivity(activityId: string) {
  try {
    await api.delete(`/schedule/activities/${activityId}`)
  } catch {
    throw new ScheduleActivityError(DELETE_ACTIVITY_ERROR)
  }
}

const UPDATE_DAY_ERROR = 'Erro ao alterar a data do dia'

// The chips and the date input keep the date inside the event, so a 400 is
// most likely a moved activity overlapping one on the days around it.
const updateDayErrorByStatus: Record<number, string> = {
  400: 'Não foi possível mover o dia: confira se a data está dentro do encontro e se as atividades não se sobrepõem às dos dias vizinhos.',
  404: 'Este dia não existe mais. Recarregue a página.',
  409: 'Já existe um dia nesta data.',
}

/** Moves a day to another date; its activities keep their times of day. */
async function updateDay(input: { dayId: string; body: UpdateScheduleDayBody }) {
  try {
    const response = await api.patch<{ result: UpdateScheduleDayResult }>(
      `/schedule/days/${input.dayId}`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw new Error(updateDayErrorByStatus[apiErrorStatus(error)] ?? UPDATE_DAY_ERROR)
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

/**
 * A clock control refused because another admin acted first: the screen was
 * stale. The page refetches and shows its message.
 */
export class ScheduleChangedError extends Error {
  constructor() {
    super('O cronograma mudou')
  }
}

/** Whether a failed clock control means the schedule changed under the admin. */
export function isScheduleChangedError(error: unknown): boolean {
  return error instanceof ScheduleChangedError
}

/** A failed clock control as the toast shows it: 409 is "O cronograma mudou". */
function toControlError(error: unknown, fallback: string): Error {
  return apiErrorStatus(error) === 409 ? new ScheduleChangedError() : new Error(fallback)
}

/** Starts the day's next planned activity, finishing the running one. */
async function startActivity(input: { activityId: string; body: ScheduleActivityControlBody }) {
  try {
    const response = await api.post<{ result: StartScheduleActivityResult }>(
      `/schedule/activities/${input.activityId}/start`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw toControlError(error, 'Não foi possível iniciar a atividade.')
  }
}

/** Finishes the running activity without starting the next one. */
async function finishActivity(input: { activityId: string; body: ScheduleActivityControlBody }) {
  try {
    const response = await api.post<{ result: FinishScheduleActivityResult }>(
      `/schedule/activities/${input.activityId}/finish`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw toControlError(error, 'Não foi possível concluir a atividade.')
  }
}

const LIVE_TIMES_REFUSED =
  'Confira os horários: o início precisa ser antes do fim e não pode se sobrepor ao de outra atividade.'
const LIVE_TRIM_REFUSED = 'A duração ajustada precisa ser maior que zero.'

/**
 * Corrects an activity's actual times or trims it. A 409 is "O cronograma
 * mudou"; a 400 reads as the rule the fields sent can break.
 */
async function updateActivityLive(input: {
  activityId: string
  body: UpdateScheduleActivityLiveBody
}) {
  try {
    const response = await api.patch<{ result: UpdateScheduleActivityLiveResult }>(
      `/schedule/activities/${input.activityId}/live`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    if (apiErrorStatus(error) !== 400) {
      throw toControlError(error, 'Não foi possível salvar o ajuste.')
    }

    const sentTimes =
      input.body.actualStartedAt !== undefined || input.body.actualEndedAt !== undefined
    throw new Error(sentTimes ? LIVE_TIMES_REFUSED : LIVE_TRIM_REFUSED)
  }
}

export const scheduleApi = {
  getSchedule,
  createDay,
  createActivity,
  updateActivity,
  deleteActivity,
  updateDay,
  deleteDay,
  startActivity,
  finishActivity,
  updateActivityLive,
}
