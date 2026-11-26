import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import {
  apiErrorStatus,
  createActivityErrorMessage,
  deleteActivityErrorMessage,
  deleteDayErrorMessage,
  updateActivityErrorMessage,
  updateDayErrorMessage,
} from './scheduleErrorMessage'

/** A failed request as axios throws it: the status and the API's `{ message, code }` body. */
function apiError(status: number, code?: string): AxiosError {
  return new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    data: { message: 'Refused', code },
  } as AxiosResponse)
}

describe('apiErrorStatus', () => {
  it('reads the status of a failed request', () => {
    expect(apiErrorStatus(apiError(409, 'conflict'))).toBe(409)
  })

  it('answers 0 for a failure that is not a response', () => {
    expect(apiErrorStatus(new Error('Network down'))).toBe(0)
  })
})

describe('activity error messages', () => {
  it('explains a locked edit with its own line, not the overlap one', () => {
    expect(updateActivityErrorMessage(apiError(400, 'schedule_activity_locked'))).toBe(
      'A atividade já começou: o início e a duração não mudam mais. Recarregue a página.'
    )
    expect(updateActivityErrorMessage(apiError(400, 'validation'))).toBe(
      'Confira o horário e os responsáveis: pode haver sobreposição ou falta alguém.'
    )
  })

  it('explains a locked delete with its own line', () => {
    expect(deleteActivityErrorMessage(apiError(400, 'schedule_activity_locked'))).toBe(
      'A atividade já começou e não pode mais ser excluída.'
    )
  })

  it('falls back to the generic line for an unknown failure', () => {
    expect(createActivityErrorMessage(new Error('Network down'))).toBe(
      'Não foi possível adicionar a atividade.'
    )
    expect(updateActivityErrorMessage(apiError(500))).toBe('Não foi possível salvar a atividade.')
    expect(deleteActivityErrorMessage(apiError(500))).toBe('Não foi possível excluir a atividade.')
  })
})

describe('day error messages', () => {
  it('explains a locked move with its own line, not the date-range one', () => {
    expect(updateDayErrorMessage(apiError(400, 'schedule_day_locked'))).toBe(
      'Este dia já tem atividades iniciadas e não pode mais mudar de data.'
    )
    expect(updateDayErrorMessage(apiError(400, 'validation'))).toMatch(/dentro do encontro/)
    expect(updateDayErrorMessage(apiError(409, 'conflict'))).toBe('Já existe um dia nesta data.')
  })

  it('explains a locked delete with its own line', () => {
    expect(deleteDayErrorMessage(apiError(400, 'schedule_day_locked'))).toBe(
      'Este dia já tem atividades iniciadas e não pode mais ser excluído.'
    )
  })

  it('falls back to the generic line for an unknown failure', () => {
    expect(updateDayErrorMessage(apiError(500))).toBe('Erro ao alterar a data do dia')
    expect(deleteDayErrorMessage(apiError(500))).toBe('Erro ao excluir dia')
  })
})
