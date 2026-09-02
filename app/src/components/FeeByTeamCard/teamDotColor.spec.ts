import { describe, expect, it } from 'vitest'
import { getTeamDotColor } from './teamDotColor'

describe('getTeamDotColor', () => {
  it('returns the same colour for the same team key', () => {
    expect(getTeamDotColor('acolhida')).toBe(getTeamDotColor('acolhida'))
  })

  it('returns a colour from the palette', () => {
    expect(getTeamDotColor('cozinha')).toMatch(/^bg-/)
  })

  it('handles an empty key without throwing', () => {
    expect(getTeamDotColor('')).toMatch(/^bg-/)
  })

  it('spreads a realistic set of teams across more than one colour', () => {
    const keys = ['acolhida', 'animacao', 'apoio', 'comunicacao', 'cozinha', 'decoracao']
    const colors = new Set(keys.map(getTeamDotColor))

    expect(colors.size).toBeGreaterThan(1)
  })
})
