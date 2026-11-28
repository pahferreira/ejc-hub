import { isAxiosError } from 'axios'
import type { ApiError } from '../general/error'

/** The HTTP status of a failed request, or 0 when it never got a response. */
export function apiErrorStatus(error: unknown): number {
  return isAxiosError(error) ? (error.response?.status ?? 0) : 0
}

/** The API's error code, or an empty string when the failure carried none. */
export function apiErrorCode(error: unknown): string {
  return isAxiosError(error) ? ((error as ApiError).response?.data?.code ?? '') : ''
}

// The API's codes for a refusal because the activity or the day has started.
// Both answer 400, so they are told apart from a plain validation by code.
const ACTIVITY_LOCKED_CODE = 'schedule_activity_locked'
const DAY_LOCKED_CODE = 'schedule_day_locked'

/**
 * The message the API's validation codes become on the form. The core refuses a
 * plan for one of a few reasons; each gets its own pt-BR line.
 */
const createActivityMessageByCode: Record<string, string> = {
  validation: 'Confira o horário e os responsáveis: pode haver sobreposição ou falta alguém.',
  not_found: 'Este dia não existe mais. Recarregue a página.',
}

const updateActivityMessageByCode: Record<string, string> = {
  ...createActivityMessageByCode,
  not_found: 'Esta atividade não existe mais. Recarregue a página.',
  [ACTIVITY_LOCKED_CODE]:
    'A atividade já começou: o início e a duração não mudam mais. Recarregue a página.',
}

const deleteActivityMessageByCode: Record<string, string> = {
  not_found: 'Esta atividade não existe mais. Recarregue a página.',
  [ACTIVITY_LOCKED_CODE]: 'A atividade já começou e não pode mais ser excluída.',
}

// The chips and the date input keep the date inside the event, so a plain 400
// is most likely a moved activity overlapping one on the days around it.
const updateDayMessageByStatus: Record<number, string> = {
  400: 'Não foi possível mover o dia: confira se a data está dentro do encontro e se as atividades não se sobrepõem às dos dias vizinhos.',
  404: 'Este dia não existe mais. Recarregue a página.',
  409: 'Já existe um dia nesta data.',
}

const DAY_LOCKED_MOVE_MESSAGE =
  'Este dia já tem atividades iniciadas e não pode mais mudar de data.'

const deleteDayMessageByCode: Record<string, string> = {
  not_found: 'Este dia não existe mais. Recarregue a página.',
  [DAY_LOCKED_CODE]: 'Este dia já tem atividades iniciadas e não pode mais ser excluído.',
}

/** A failed activity create as the form shows it. */
export function createActivityErrorMessage(error: unknown): string {
  return (
    createActivityMessageByCode[apiErrorCode(error)] ?? 'Não foi possível adicionar a atividade.'
  )
}

/** A failed activity edit as the form shows it. */
export function updateActivityErrorMessage(error: unknown): string {
  return updateActivityMessageByCode[apiErrorCode(error)] ?? 'Não foi possível salvar a atividade.'
}

/** A failed activity delete as the toast shows it. */
export function deleteActivityErrorMessage(error: unknown): string {
  return deleteActivityMessageByCode[apiErrorCode(error)] ?? 'Não foi possível excluir a atividade.'
}

/** A failed day move as the day modal shows it. */
export function updateDayErrorMessage(error: unknown): string {
  // The lock is a 400 too, so its code is read before the status.
  if (apiErrorCode(error) === DAY_LOCKED_CODE) {
    return DAY_LOCKED_MOVE_MESSAGE
  }

  return updateDayMessageByStatus[apiErrorStatus(error)] ?? 'Erro ao alterar a data do dia'
}

/** A failed day delete as the toast shows it. */
export function deleteDayErrorMessage(error: unknown): string {
  return deleteDayMessageByCode[apiErrorCode(error)] ?? 'Erro ao excluir dia'
}
