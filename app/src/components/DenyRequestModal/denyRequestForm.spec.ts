import { describe, expect, it } from 'vitest'
import { canSubmitDenial, denyImpactMessage } from './denyRequestForm'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'

describe('canSubmitDenial', () => {
  it('allows a denial with a reason', () => {
    expect(canSubmitDenial({ reason: 'A equipe já está completa.' })).toBe(true)
  })

  it('blocks an empty reason', () => {
    expect(canSubmitDenial({ reason: '' })).toBe(false)
  })

  it('blocks a reason that is only whitespace', () => {
    expect(canSubmitDenial({ reason: '    ' })).toBe(false)
  })

  it('blocks a reason one character over the cap', () => {
    expect(canSubmitDenial({ reason: 'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX + 1) })).toBe(false)
  })

  it('allows a reason exactly at the cap', () => {
    expect(canSubmitDenial({ reason: 'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX) })).toBe(true)
  })

  it('blocks while the denial is in flight, so it cannot be sent twice', () => {
    expect(canSubmitDenial({ reason: 'Sem vagas.', isSaving: true })).toBe(false)
  })

  it('counts the raw length, not the trimmed one, so it agrees with the counter', () => {
    // Trimming would bring this under the cap and re-enable the button while
    // the counter beside the field is already red.
    const overCapWithTrailingSpaces = `${'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX)}   `

    expect(canSubmitDenial({ reason: overCapWithTrailingSpaces })).toBe(false)
  })
})

describe('denyImpactMessage', () => {
  it('says there are no other requests when the member has none', () => {
    expect(denyImpactMessage(0)).toBe(
      'O membro continuará na lista de espera sem outras solicitações pendentes.'
    )
  })

  it('uses the singular team and verb for exactly one other request', () => {
    expect(denyImpactMessage(1)).toBe(
      'O membro continuará na lista de espera com 1 solicitação pendente de outra equipe.'
    )
  })

  it('uses the plural team and verb for more than one', () => {
    expect(denyImpactMessage(3)).toBe(
      'O membro continuará na lista de espera com 3 solicitações pendentes de outras equipes.'
    )
  })

  it('treats a negative count as none rather than rendering it', () => {
    expect(denyImpactMessage(-1)).toBe(
      'O membro continuará na lista de espera sem outras solicitações pendentes.'
    )
  })
})
