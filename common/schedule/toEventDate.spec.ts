import { describe, it, expect } from 'vitest'
import { toEventDate } from './toEventDate'

describe('toEventDate', () => {
  it('reads an instant as the São Paulo date', () => {
    expect(toEventDate(new Date('2026-11-14T11:30:00.000Z'))).toBe('2026-11-14')
  })

  it('keeps a late-night activity on its São Paulo day even when UTC has moved on', () => {
    expect(toEventDate(new Date('2026-11-15T02:30:00.000Z'))).toBe('2026-11-14')
  })
})
