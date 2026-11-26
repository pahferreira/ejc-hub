import { describe, expect, it } from 'vitest'
import { noteBodyError } from './useScheduleNoteForm'

describe('noteBodyError', () => {
  it('accepts a note of up to 500 characters, ignoring the spaces around it', () => {
    expect(noteBodyError('Levar os violões')).toBeUndefined()
    expect(noteBodyError(`  ${'a'.repeat(500)}  `)).toBeUndefined()
  })

  it('refuses an empty or blank note', () => {
    expect(noteBodyError('')).toBe('Escreva a nota')
    expect(noteBodyError('   ')).toBe('Escreva a nota')
  })

  it('refuses a note over 500 characters', () => {
    expect(noteBodyError('a'.repeat(501))).toBe('A nota pode ter até 500 caracteres')
  })
})
