import { describe, it, expect } from 'vitest'
import {
  scheduleActivityFormSchema,
  type ScheduleActivityFormValues,
} from './scheduleActivityForm.schema'

const VALID: ScheduleActivityFormValues = {
  title: 'Acolhida',
  startTime: '18:00',
  durationMinutes: 30,
  place: 'Salão',
  teamInstanceIds: ['t1'],
  guestName: '',
  adminsResponsible: false,
  allTeams: false,
}

/** The first error message per field, or `{}` when the values pass. */
function fieldErrors(values: ScheduleActivityFormValues): Record<string, string> {
  const result = scheduleActivityFormSchema.safeParse(values)
  if (result.success) {
    return {}
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    errors[field] ??= issue.message
  }
  return errors
}

describe('scheduleActivityFormSchema', () => {
  it('accepts a complete activity', () => {
    expect(fieldErrors(VALID)).toEqual({})
  })

  it('accepts a guest alone as the responsible', () => {
    expect(fieldErrors({ ...VALID, teamInstanceIds: [], guestName: 'Padre João' })).toEqual({})
  })

  it('accepts the admins alone as the responsible', () => {
    expect(fieldErrors({ ...VALID, teamInstanceIds: [], adminsResponsible: true })).toEqual({})
  })

  it('accepts all teams alone as the responsible', () => {
    expect(fieldErrors({ ...VALID, teamInstanceIds: [], allTeams: true })).toEqual({})
  })

  it('asks for a responsible when there are no teams, no guest and no admins', () => {
    expect(fieldErrors({ ...VALID, teamInstanceIds: [] })).toEqual({
      teamInstanceIds: 'Escolha ao menos um responsável',
    })
  })

  it('does not count a guest made of spaces as a responsible', () => {
    expect(fieldErrors({ ...VALID, teamInstanceIds: [], guestName: '   ' })).toEqual({
      teamInstanceIds: 'Escolha ao menos um responsável',
    })
  })

  it('asks for a responsible alongside the other field errors', () => {
    expect(fieldErrors({ ...VALID, title: '', teamInstanceIds: [] })).toEqual({
      title: 'Informe um título',
      teamInstanceIds: 'Escolha ao menos um responsável',
    })
  })

  it('asks for a title when it is empty or only spaces', () => {
    expect(fieldErrors({ ...VALID, title: '' })).toEqual({ title: 'Informe um título' })
    expect(fieldErrors({ ...VALID, title: '   ' })).toEqual({ title: 'Informe um título' })
  })

  it('asks for a place when it is empty or only spaces', () => {
    expect(fieldErrors({ ...VALID, place: '' })).toEqual({ place: 'Informe o local' })
    expect(fieldErrors({ ...VALID, place: '  ' })).toEqual({ place: 'Informe o local' })
  })

  it('accepts one- and two-digit hours as the start', () => {
    expect(fieldErrors({ ...VALID, startTime: '8:00' })).toEqual({})
    expect(fieldErrors({ ...VALID, startTime: '08:00' })).toEqual({})
  })

  it('asks for a start time when it is empty or not HH:mm', () => {
    expect(fieldErrors({ ...VALID, startTime: '' })).toEqual({ startTime: 'Informe um horário' })
    expect(fieldErrors({ ...VALID, startTime: '18h' })).toEqual({ startTime: 'Informe um horário' })
  })

  it.each([0, -15, Number.NaN, Number.POSITIVE_INFINITY])(
    'asks for a duration when it is %s',
    (durationMinutes) => {
      expect(fieldErrors({ ...VALID, durationMinutes })).toEqual({
        durationMinutes: 'Informe uma duração',
      })
    }
  )

  it('reports every invalid field at once', () => {
    expect(
      fieldErrors({ ...VALID, title: '', startTime: '', durationMinutes: 0, place: '' })
    ).toEqual({
      title: 'Informe um título',
      startTime: 'Informe um horário',
      durationMinutes: 'Informe uma duração',
      place: 'Informe o local',
    })
  })

  it('leaves the values untouched: trimming happens when building the body', () => {
    const result = scheduleActivityFormSchema.parse({ ...VALID, title: ' Acolhida ' })
    expect(result.title).toBe(' Acolhida ')
  })
})
