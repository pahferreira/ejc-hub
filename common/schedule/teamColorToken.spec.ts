import { describe, it, expect } from 'vitest'
import { TEAM_COLOR_TOKENS, teamColorToken } from './teamColorToken'

describe('teamColorToken', () => {
  it('always returns a token from the palette', () => {
    for (const key of ['liturgia', 'cozinha', 'acolhida', 'som', 'a', '']) {
      expect(TEAM_COLOR_TOKENS).toContain(teamColorToken(key))
    }
  })

  it('is stable for the same key', () => {
    expect(teamColorToken('liturgia')).toBe(teamColorToken('liturgia'))
  })

  it('spreads different keys across the palette', () => {
    const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
    const tokens = new Set(keys.map(teamColorToken))

    expect(tokens.size).toBeGreaterThan(1)
  })
})
