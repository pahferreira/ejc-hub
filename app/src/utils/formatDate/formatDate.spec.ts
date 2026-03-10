import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('should format a date string in pt-BR locale with short month, day, year, hour, and minute', () => {
    const result = formatDate('2024-06-15T14:30:00Z')
    expect(result).toBe('15 de jun. de 2024, 14:30')
  })

  it('should handle ISO date strings', () => {
    const result = formatDate('2023-01-01T00:00:00.000Z')
    expect(result).toBe('01 de jan. de 2023, 00:00')
  })

  it('should handle different date strings', () => {
    const result = formatDate('2024-12-25')
    expect(result).toBe('25 de dez. de 2024, 00:00')
  })
})
