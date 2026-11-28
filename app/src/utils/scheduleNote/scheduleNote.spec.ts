import { describe, expect, it } from 'vitest'
import { noteAuthorLine } from './scheduleNote'

describe('noteAuthorLine', () => {
  it("names a coordinator's note with the coordination and its São Paulo time", () => {
    expect(
      noteAuthorLine({
        id: 'n1',
        body: 'Levar os violões',
        authorName: 'Ana',
        authorRole: 'coordinator',
        createdAt: '2026-04-03T17:32:00Z',
      })
    ).toBe('Ana (coordenação) · 14:32')
  })

  it("names an admin's note with the administration", () => {
    expect(
      noteAuthorLine({
        id: 'n2',
        body: 'Atrasar 5 min',
        authorName: 'Bruno',
        authorRole: 'admin',
        createdAt: '2026-04-04T02:05:00Z',
      })
    ).toBe('Bruno (administração) · 23:05')
  })
})
