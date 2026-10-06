import { describe, it, expect } from 'vitest'
import { canSubmitRequest } from './requestMemberForm'
import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'

describe('canSubmitRequest', () => {
  it('refuses an empty message', () => {
    expect(canSubmitRequest({ message: '' })).toBe(false)
  })

  it('refuses a whitespace-only message', () => {
    expect(canSubmitRequest({ message: '   ' })).toBe(false)
  })

  it('allows a message within the cap', () => {
    expect(canSubmitRequest({ message: 'Precisamos de alguém com experiência em som.' })).toBe(true)
  })

  it('allows a message exactly at the cap', () => {
    const message = 'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX)

    expect(canSubmitRequest({ message })).toBe(true)
  })

  it('refuses a message over the cap, matching the counter turning red', () => {
    const message = 'a'.repeat(MEMBER_REQUEST_MESSAGE_MAX + 1)

    expect(canSubmitRequest({ message })).toBe(false)
  })

  it('refuses while a write is in flight, so it cannot be double-sent', () => {
    expect(canSubmitRequest({ message: 'Motivo válido', isSaving: true })).toBe(false)
  })
})
