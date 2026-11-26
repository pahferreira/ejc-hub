import { describe, expect, it } from 'vitest'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  buildLiveEditBody,
  canEditLive,
  LIVE_EDIT_ERROR,
  liveEditErrorMessage,
  liveEditFields,
  liveEditFormValues,
  validateLiveEdit,
} from './scheduleLiveEdit'

type LiveActivity = Pick<
  ScheduleActivity,
  'status' | 'adjustedDurationMinutes' | 'actualStartedAt' | 'actualEndedAt'
>

// Started at 18:02:30 and ended at 18:31 in São Paulo (UTC-3).
const DONE: LiveActivity = {
  status: 'done',
  adjustedDurationMinutes: null,
  actualStartedAt: '2026-04-03T21:02:30.000Z',
  actualEndedAt: '2026-04-03T21:31:00.000Z',
}

const RUNNING: LiveActivity = { ...DONE, status: 'running', actualEndedAt: null }

const PLANNED: LiveActivity = {
  status: 'planned',
  adjustedDurationMinutes: null,
  actualStartedAt: null,
  actualEndedAt: null,
}

const ALL_FIELDS = { trim: true, start: true, end: true }

describe('liveEditFields', () => {
  it.each([
    ['planned', { trim: true, start: false, end: false }],
    ['running', { trim: true, start: true, end: false }],
    ['done', { trim: false, start: true, end: true }],
    ['skipped', { trim: false, start: false, end: false }],
  ] as const)('shows the parts a %s activity can change', (status, fields) => {
    expect(liveEditFields(status)).toEqual(fields)
  })
})

describe('canEditLive', () => {
  it('offers the edit on a planned, running or done activity', () => {
    expect(['planned', 'running', 'done'].map((s) => canEditLive(s as 'planned'))).toEqual([
      true,
      true,
      true,
    ])
  })

  it('offers nothing on a skipped activity', () => {
    expect(canEditLive('skipped')).toBe(false)
  })
})

describe('liveEditFormValues', () => {
  it('pre-fills the actual times on the São Paulo clock and the trim', () => {
    expect(liveEditFormValues({ ...DONE, adjustedDurationMinutes: 20 })).toEqual({
      adjustedDuration: '20',
      startTime: '18:02',
      endTime: '18:31',
    })
  })

  it('leaves empty what the activity does not have', () => {
    expect(liveEditFormValues(PLANNED)).toEqual({
      adjustedDuration: '',
      startTime: '',
      endTime: '',
    })
  })
})

describe('validateLiveEdit', () => {
  it('accepts a whole trim and HH:mm times', () => {
    expect(
      validateLiveEdit({ adjustedDuration: '20', startTime: '18:00', endTime: '18:30' }, ALL_FIELDS)
    ).toEqual({})
  })

  it('accepts an empty trim: no trim', () => {
    expect(
      validateLiveEdit(
        { adjustedDuration: '', startTime: '', endTime: '' },
        liveEditFields('planned')
      )
    ).toEqual({})
  })

  it.each(['0', '-5', '1.5', 'abc'])('refuses a trim of %s', (adjustedDuration) => {
    expect(
      validateLiveEdit({ adjustedDuration, startTime: '', endTime: '' }, liveEditFields('planned'))
    ).toEqual({ adjustedDuration: 'Informe uma duração maior que zero' })
  })

  it('refuses a missing or malformed actual time on the parts it shows', () => {
    expect(
      validateLiveEdit({ adjustedDuration: '', startTime: '', endTime: '25:00' }, ALL_FIELDS)
    ).toEqual({ startTime: 'Informe um horário', endTime: 'Informe um horário' })
  })
})

describe('buildLiveEditBody', () => {
  it('sends only the actual time that changed, on its São Paulo date', () => {
    expect(
      buildLiveEditBody(DONE, { adjustedDuration: '', startTime: '18:02', endTime: '18:25' })
    ).toEqual({ expectedStatus: 'done', actualEndedAt: '2026-04-03T21:25:00.000Z' })
  })

  it('keeps a past-midnight time on its own date', () => {
    const lateNight: LiveActivity = {
      ...DONE,
      actualStartedAt: '2026-04-04T02:50:00.000Z',
      actualEndedAt: '2026-04-04T03:20:00.000Z',
    }

    expect(
      buildLiveEditBody(lateNight, { adjustedDuration: '', startTime: '23:50', endTime: '00:10' })
    ).toEqual({ expectedStatus: 'done', actualEndedAt: '2026-04-04T03:10:00.000Z' })
  })

  it('rolls an end earlier than the start on the clock to the next day: 23:55 to 00:05', () => {
    // 23:50 to 23:59 on the 3rd, corrected to 23:55 – 00:05.
    const beforeMidnight: LiveActivity = {
      ...DONE,
      actualStartedAt: '2026-04-04T02:50:00.000Z',
      actualEndedAt: '2026-04-04T02:59:00.000Z',
    }

    expect(
      buildLiveEditBody(beforeMidnight, {
        adjustedDuration: '',
        startTime: '23:55',
        endTime: '00:05',
      })
    ).toEqual({
      expectedStatus: 'done',
      actualStartedAt: '2026-04-04T02:55:00.000Z',
      actualEndedAt: '2026-04-04T03:05:00.000Z',
    })
  })

  it('moves a start corrected past midnight to the next day', () => {
    // Running since 23:50 on the 3rd; it really started at 00:05 on the 4th.
    const lateRunning: LiveActivity = { ...RUNNING, actualStartedAt: '2026-04-04T02:50:00.000Z' }

    expect(
      buildLiveEditBody(lateRunning, { adjustedDuration: '', startTime: '00:05', endTime: '' })
    ).toEqual({ expectedStatus: 'running', actualStartedAt: '2026-04-04T03:05:00.000Z' })
  })

  it('moves a start corrected back before midnight to the previous day', () => {
    // Running since 00:02 on the 4th; it really started at 23:58 on the 3rd.
    const earlyRunning: LiveActivity = { ...RUNNING, actualStartedAt: '2026-04-04T03:02:00.000Z' }

    expect(
      buildLiveEditBody(earlyRunning, { adjustedDuration: '', startTime: '23:58', endTime: '' })
    ).toEqual({ expectedStatus: 'running', actualStartedAt: '2026-04-04T02:58:00.000Z' })
  })

  it('sends a new trim, and the start of a running activity when it changed', () => {
    expect(
      buildLiveEditBody(RUNNING, { adjustedDuration: '20', startTime: '18:00', endTime: '' })
    ).toEqual({
      expectedStatus: 'running',
      adjustedDurationMinutes: 20,
      actualStartedAt: '2026-04-03T21:00:00.000Z',
    })
  })

  it('clears an emptied trim with null', () => {
    expect(
      buildLiveEditBody(
        { ...PLANNED, adjustedDurationMinutes: 20 },
        { adjustedDuration: '', startTime: '', endTime: '' }
      )
    ).toEqual({ expectedStatus: 'planned', adjustedDurationMinutes: null })
  })

  it('answers null when nothing changed', () => {
    expect(buildLiveEditBody(RUNNING, liveEditFormValues(RUNNING))).toBeNull()
  })

  it('ignores the parts the status does not show', () => {
    expect(
      buildLiveEditBody(DONE, { adjustedDuration: '20', startTime: '18:02', endTime: '18:31' })
    ).toBeNull()
  })
})

describe('liveEditErrorMessage', () => {
  it.each([
    ['schedule_actual_start_not_before_end', 'O início real precisa ser antes do fim.'],
    ['schedule_actual_start_in_future', 'O início real não pode estar no futuro.'],
    ['schedule_actual_end_in_future', 'O fim real não pode estar no futuro.'],
    ['schedule_actual_times_overlap', 'Os horários reais se sobrepõem aos de outra atividade.'],
    ['schedule_trim_not_positive', 'A duração ajustada precisa ser maior que zero.'],
    [
      'schedule_trim_not_allowed',
      'Só uma atividade planejada ou em andamento pode ter a duração ajustada.',
    ],
    ['schedule_actual_time_not_allowed', 'Esta atividade não tem esse horário real para corrigir.'],
    ['schedule_nothing_to_change', 'Nada mudou para salvar.'],
  ])('names the rule behind %s', (code, message) => {
    expect(liveEditErrorMessage(code)).toBe(message)
  })

  it('falls back to a generic line for an unknown code', () => {
    expect(liveEditErrorMessage('something_else')).toBe(LIVE_EDIT_ERROR)
  })
})
