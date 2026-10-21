import { describe, it, expect } from 'vitest'
import {
  clearJustification,
  filterRoster,
  groupRoster,
  initialMeetingForm,
  justify,
  markAll,
  meetingFormFromMeeting,
  meetingRoster,
  rowStatus,
  setPresent,
  setReason,
  tallyAttendance,
  toMeetingBody,
  validateMeetingForm,
} from './meetingForm'
import type {
  AttendanceMeeting,
  AttendanceRosterMember,
  MeetingAttendanceEntry,
} from '../../services/attendance/attendance.types'

const TODAY = '2026-10-20'

function member(
  userId: string,
  name: string,
  nickname: string,
  type: AttendanceRosterMember['type'] = 'member'
): AttendanceRosterMember {
  return {
    userId,
    name,
    nickname,
    pictureUrl: null,
    type,
    joinedAt: '2026-10-01T12:00:00Z',
    rate: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
  }
}

const ROSTER = [
  member('ana', 'Ana Coordenadora', 'Aninha', 'coordinator'),
  member('joao', 'João Silva', 'Jota'),
  member('bia', 'Beatriz Souza', 'Bia'),
  member('caio', 'Caio Lima', 'Caio'),
]

describe('row status', () => {
  it('starts everyone as absent, dated today', () => {
    const form = initialMeetingForm(TODAY)

    expect(form.heldOn).toBe(TODAY)
    expect(rowStatus(form, 'ana')).toBe('absent')
  })

  it('ticks and unticks a person between present and absent', () => {
    const ticked = setPresent(initialMeetingForm(TODAY), 'ana', true)
    expect(rowStatus(ticked, 'ana')).toBe('present')

    expect(rowStatus(setPresent(ticked, 'ana', false), 'ana')).toBe('absent')
  })

  it('justifies an absence and the × puts it back to absent', () => {
    const justified = justify(initialMeetingForm(TODAY), 'ana')
    expect(rowStatus(justified, 'ana')).toBe('justified')

    expect(rowStatus(clearJustification(justified, 'ana'), 'ana')).toBe('absent')
  })

  it('ticking someone marked Justificada clears the justification', () => {
    const justified = setReason(justify(initialMeetingForm(TODAY), 'ana'), 'ana', 'Trabalho')

    const ticked = setPresent(justified, 'ana', true)
    const unticked = setPresent(ticked, 'ana', false)

    expect(rowStatus(ticked, 'ana')).toBe('present')
    // The old reason does not come back when the tick is undone.
    expect(rowStatus(unticked, 'ana')).toBe('absent')
    expect(unticked.reasons.ana).toBeUndefined()
  })
})

describe('roster', () => {
  it('searches by name or nickname, ignoring case and accents', () => {
    expect(filterRoster(ROSTER, 'joao').map((m) => m.userId)).toEqual(['joao'])
    expect(filterRoster(ROSTER, 'ANINHA').map((m) => m.userId)).toEqual(['ana'])
    expect(filterRoster(ROSTER, '  ')).toHaveLength(ROSTER.length)
  })

  it('groups coordinators apart from members', () => {
    const groups = groupRoster(ROSTER)

    expect(groups.coordinators.map((m) => m.userId)).toEqual(['ana'])
    expect(groups.members.map((m) => m.userId)).toEqual(['joao', 'bia', 'caio'])
  })
})

describe('Marcar todos', () => {
  it('ticks every given person, clearing their justifications', () => {
    const form = markAll(justify(initialMeetingForm(TODAY), 'bia'), ['ana', 'bia'], true)

    expect(rowStatus(form, 'ana')).toBe('present')
    expect(rowStatus(form, 'bia')).toBe('present')
    expect(form.reasons.bia).toBeUndefined()
    expect(rowStatus(form, 'caio')).toBe('absent')
  })

  it('unticks every given present person without touching a justified one', () => {
    let form = markAll(initialMeetingForm(TODAY), ['ana', 'joao'], true)
    form = justify(form, 'bia')

    form = markAll(form, ['ana', 'joao', 'bia'], false)

    expect(rowStatus(form, 'ana')).toBe('absent')
    expect(rowStatus(form, 'joao')).toBe('absent')
    expect(rowStatus(form, 'bia')).toBe('justified')
  })
})

describe('tallyAttendance', () => {
  it('counts the whole roster, the unmarked as absent', () => {
    let form = setPresent(initialMeetingForm(TODAY), 'ana', true)
    form = setPresent(form, 'joao', true)
    form = justify(form, 'bia')

    expect(tallyAttendance(form, ROSTER)).toEqual({ present: 2, absent: 1, justified: 1 })
  })

  it('ignores a status left on someone no longer on the roster', () => {
    const form = setPresent(initialMeetingForm(TODAY), 'ghost', true)

    expect(tallyAttendance(form, ROSTER)).toEqual({ present: 0, absent: 4, justified: 0 })
  })
})

describe('validateMeetingForm', () => {
  it('passes a dated form with every justification explained', () => {
    const form = setReason(justify(initialMeetingForm(TODAY), 'bia'), 'bia', 'Trabalho')

    expect(validateMeetingForm(form, ROSTER, TODAY)).toEqual({ isValid: true, reasons: {} })
  })

  it('requires a date', () => {
    const form = { ...initialMeetingForm(TODAY), heldOn: '' }

    const result = validateMeetingForm(form, ROSTER, TODAY)

    expect(result.isValid).toBe(false)
    expect(result.heldOn).toBeDefined()
  })

  it('rejects a date after today, but not today itself', () => {
    const future = { ...initialMeetingForm(TODAY), heldOn: '2026-10-21' }

    expect(validateMeetingForm(future, ROSTER, TODAY)).toMatchObject({ isValid: false })
    expect(validateMeetingForm(future, ROSTER, TODAY).heldOn).toBeDefined()
    expect(validateMeetingForm(initialMeetingForm(TODAY), ROSTER, TODAY).isValid).toBe(true)
  })

  it('flags each justified row whose reason is blank', () => {
    let form = justify(initialMeetingForm(TODAY), 'bia')
    form = setReason(justify(form, 'caio'), 'caio', '   ')
    form = setReason(justify(form, 'joao'), 'joao', 'Viagem')

    const result = validateMeetingForm(form, ROSTER, TODAY)

    expect(result.isValid).toBe(false)
    expect(Object.keys(result.reasons).sort()).toEqual(['bia', 'caio'])
  })
})

describe('toMeetingBody', () => {
  it('sends the ticked and the justified, trimmed, and leaves the rest to be absent', () => {
    let form = { ...initialMeetingForm(TODAY), heldOn: '2026-10-18', title: ' Ensaio geral ' }
    form = setPresent(form, 'ana', true)
    form = setReason(justify(form, 'bia'), 'bia', ' Trabalho ')

    expect(toMeetingBody(form, ROSTER)).toEqual({
      heldOn: '2026-10-18',
      title: 'Ensaio geral',
      description: undefined,
      presentUserIds: ['ana'],
      justified: [{ userId: 'bia', reason: 'Trabalho' }],
    })
  })

  it('never sends someone who is not on the roster', () => {
    let form = setPresent(initialMeetingForm(TODAY), 'ghost', true)
    form = setReason(justify(form, 'stranger'), 'stranger', 'Trabalho')

    const body = toMeetingBody(form, ROSTER)

    expect(body.presentUserIds).toEqual([])
    expect(body.justified).toEqual([])
  })
})

describe('editing a meeting', () => {
  function entry(
    userId: string,
    name: string,
    status: MeetingAttendanceEntry['status'],
    justificationReason: string | null = null
  ): MeetingAttendanceEntry {
    return { userId, name, nickname: name, pictureUrl: null, status, justificationReason }
  }

  // 'ghost' has left the team since; 'caio' joined after and has no row.
  const MEETING: AttendanceMeeting = {
    id: 'm1',
    heldOn: '2026-10-18',
    title: 'Ensaio geral',
    description: null,
    edited: false,
    rate: { present: 1, eligible: 2, justified: 1, percentage: 50, band: 'needs-replacement' },
    attendances: [
      entry('ana', 'Aninha', 'present'),
      entry('joao', 'Jota', 'absent'),
      entry('ghost', 'Fantasma', 'justified', 'Viagem'),
    ],
  }

  it("pre-fills the date, text, statuses and reasons from the meeting's rows", () => {
    const form = meetingFormFromMeeting(MEETING)

    expect(form).toMatchObject({ heldOn: '2026-10-18', title: 'Ensaio geral', description: '' })
    expect(rowStatus(form, 'ana')).toBe('present')
    expect(rowStatus(form, 'joao')).toBe('absent')
    expect(rowStatus(form, 'ghost')).toBe('justified')
    expect(form.reasons.ghost).toBe('Viagem')
  })

  it("takes the roster from the meeting's rows: removed members stay, later joiners don't appear", () => {
    const roster = meetingRoster(MEETING, ROSTER)

    expect(roster.map((person) => person.userId)).toEqual(['ana', 'joao', 'ghost'])
    expect(groupRoster(roster)).toMatchObject({
      coordinators: [expect.objectContaining({ userId: 'ana' })],
      members: [expect.objectContaining({ userId: 'joao' })],
      removed: [expect.objectContaining({ userId: 'ghost' })],
    })
  })

  it("sends every row's status from the meeting roster, the removed member included", () => {
    const roster = meetingRoster(MEETING, ROSTER)
    const form = setPresent(meetingFormFromMeeting(MEETING), 'joao', true)

    expect(toMeetingBody(form, roster)).toEqual({
      heldOn: '2026-10-18',
      title: 'Ensaio geral',
      description: undefined,
      presentUserIds: ['ana', 'joao'],
      justified: [{ userId: 'ghost', reason: 'Viagem' }],
    })
  })
})
