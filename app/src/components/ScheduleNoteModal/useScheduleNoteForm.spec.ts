import { describe, expect, it } from 'vitest'
import { activityAfterSave, noteBodyError } from './useScheduleNoteForm'

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

describe('activityAfterSave', () => {
  const saved = { id: 'act-1', title: 'Abertura' }

  it('closes the modal of the activity whose note was saved', () => {
    expect(activityAfterSave(saved, 'act-1')).toBeNull()
  })

  it('leaves open a modal for another activity opened while saving', () => {
    const other = { id: 'act-2', title: 'Palestra' }

    expect(activityAfterSave(other, 'act-1')).toBe(other)
  })

  it('stays closed when the modal was already closed', () => {
    expect(activityAfterSave(null, 'act-1')).toBeNull()
  })
})
