import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

// `Intl.NumberFormat` separates the symbol from the number with U+00A0, a
// non-breaking space that looks exactly like a plain one in a diff. Spelling it
// out is the difference between this file passing and an hour of confusion.
const NBSP = ' '

describe('formatCurrency', () => {
  it('renders cents as reais with two decimal places', () => {
    expect(formatCurrency(12_345, 'BRL')).toBe(`R$${NBSP}123,45`)
  })

  it('groups thousands the pt-BR way, with a dot', () => {
    expect(formatCurrency(1_234_500, 'BRL')).toBe(`R$${NBSP}12.345,00`)
  })

  it('renders zero rather than an empty string, so a card never looks broken', () => {
    expect(formatCurrency(0, 'BRL')).toBe(`R$${NBSP}0,00`)
  })

  it('honours a currency other than the default', () => {
    expect(formatCurrency(5_000, 'USD')).toBe(`US$${NBSP}50,00`)
  })
})
