import { describe, expect, it } from 'vitest'
import { controlErrorMessage } from './schedule.api'

const FALLBACK = 'Não foi possível desfazer.'

describe('controlErrorMessage', () => {
  it('says the schedule changed on a 409', () => {
    expect(controlErrorMessage({ status: 409, code: 'conflict' }, FALLBACK)).toBe(
      'O cronograma mudou'
    )
  })

  it.each([
    ['schedule_nothing_to_undo', 'Esta atividade não tem nada para desfazer.'],
    ['schedule_reopen_not_latest', 'Só a última atividade concluída pode ser reaberta.'],
    ['schedule_reopen_while_running', 'Conclua a atividade em andamento antes de reabrir outra.'],
    [
      'schedule_undo_skip_after_later_start',
      'Uma atividade seguinte do dia já começou, então o pulo não pode ser desfeito.',
    ],
  ])('gives the reason of a %s refusal', (code, message) => {
    expect(controlErrorMessage({ status: 400, code }, FALLBACK)).toBe(message)
  })

  it.each([
    ['a plain validation refusal', 400, 'validation'],
    ['a missing activity', 404, 'not_found'],
    ['a failure with no response', 0, ''],
  ])('falls back to the control message for %s', (_label, status, code) => {
    expect(controlErrorMessage({ status, code }, FALLBACK)).toBe(FALLBACK)
  })
})
