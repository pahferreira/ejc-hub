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
  SkipScheduleActivityResult,
  StartScheduleActivityResult,
  UndoScheduleActivityResult,
  UpdateScheduleActivityResult,
  UpdateScheduleDayBody,
  UpdateScheduleDayResult,
} from './schedule.types'
import {
  apiErrorCode,
  apiErrorStatus,
  createActivityErrorMessage,
  deleteActivityErrorMessage,
  deleteDayErrorMessage,
  updateActivityErrorMessage,
  updateDayErrorMessage,
} from './scheduleErrorMessage'

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
 * The error the activity form shows. Carries the pt-BR message so the form can
 * render it inline near its buttons.
 */
export class ScheduleActivityError extends Error {}

/** Adds an activity to a day of the current event. */
async function createActivity(body: ScheduleActivityBody) {
  try {
    const response = await api.post<{ result: CreateScheduleActivityResult }>(
      '/schedule/activities',
      body
    )

    return response.data.result
  } catch (error: unknown) {
    throw new ScheduleActivityError(createActivityErrorMessage(error))
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
    throw new ScheduleActivityError(updateActivityErrorMessage(error))
  }
}

/** Hard-deletes an activity and its team links. */
async function deleteActivity(activityId: string) {
  try {
    await api.delete(`/schedule/activities/${activityId}`)
  } catch (error: unknown) {
    throw new ScheduleActivityError(deleteActivityErrorMessage(error))
  }
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
    throw new Error(updateDayErrorMessage(error))
  }
}

/** Hard-deletes a day and every activity on it. */
async function deleteDay(dayId: string) {
  try {
    await api.delete(`/schedule/days/${dayId}`)
  } catch (error: unknown) {
    throw new Error(deleteDayErrorMessage(error))
  }
}

/** Another admin acted first: the screen was stale. The page refetches. */
const SCHEDULE_CHANGED_MESSAGE = 'O cronograma mudou'

/** Why the API refused an undo, by its error code, as the toast says it. */
const undoRefusalMessageByCode: Record<string, string> = {
  schedule_nothing_to_undo: 'Esta atividade não tem nada para desfazer.',
  schedule_reopen_not_latest: 'Só a última atividade concluída pode ser reaberta.',
  schedule_reopen_while_running: 'Conclua a atividade em andamento antes de reabrir outra.',
  schedule_undo_skip_after_later_start:
    'Uma atividade seguinte do dia já começou, então o pulo não pode ser desfeito.',
}

/**
 * The toast message of a failed clock control, from the API's status and
 * code: a 409 is "O cronograma mudou", an undo refusal says which rule
 * refused it, and anything else is the control's own fallback.
 */
export function controlErrorMessage(
  failure: { status: number; code: string },
  fallback: string
): string {
  if (failure.status === 409) {
    return SCHEDULE_CHANGED_MESSAGE
  }

  return undoRefusalMessageByCode[failure.code] ?? fallback
}

/** A failed clock control as the toast shows it. */
function toControlError(error: unknown, fallback: string): Error {
  return new Error(
    controlErrorMessage({ status: apiErrorStatus(error), code: apiErrorCode(error) }, fallback)
  )
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

/** Skips a planned activity: it takes no time and the day moves earlier. */
async function skipActivity(input: { activityId: string; body: ScheduleActivityControlBody }) {
  try {
    const response = await api.post<{ result: SkipScheduleActivityResult }>(
      `/schedule/activities/${input.activityId}/skip`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw toControlError(error, 'Não foi possível pular a atividade.')
  }
}

/** Undoes an activity's last start, finish or skip, named by the status the screen shows. */
async function undoActivity(input: { activityId: string; body: ScheduleActivityControlBody }) {
  try {
    const response = await api.post<{ result: UndoScheduleActivityResult }>(
      `/schedule/activities/${input.activityId}/undo`,
      input.body
    )

    return response.data.result
  } catch (error: unknown) {
    throw toControlError(error, 'Não foi possível desfazer.')
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
  skipActivity,
  undoActivity,
}
