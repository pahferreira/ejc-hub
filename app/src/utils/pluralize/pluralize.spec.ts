import { describe, expect, it } from 'vitest'
import { pluralize } from './pluralize'

describe('pluralize', () => {
  it('returns the singular wording for exactly one', () => {
    expect(pluralize(1, 'membro selecionado', 'membros selecionados')).toBe('membro selecionado')
  })

  it('returns the plural wording for more than one', () => {
    expect(pluralize(2, 'membro selecionado', 'membros selecionados')).toBe('membros selecionados')
  })

  it('returns the plural wording for zero, as pt-BR does', () => {
    expect(pluralize(0, 'taxa', 'taxas')).toBe('taxas')
  })
})
