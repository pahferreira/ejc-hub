import { describe, expect, it } from 'vitest'
import { getFeeTone } from './feeTone'

describe('getFeeTone', () => {
  it('returns success when every member has paid', () => {
    expect(getFeeTone(100, 9)).toBe('success')
  })

  it('returns warning at exactly half paid', () => {
    expect(getFeeTone(50, 6)).toBe('warning')
  })

  it('returns warning for a majority paid', () => {
    expect(getFeeTone(67, 3)).toBe('warning')
  })

  it('returns error just below half paid', () => {
    expect(getFeeTone(49, 100)).toBe('error')
  })

  it('returns error when a minority has paid', () => {
    expect(getFeeTone(43, 7)).toBe('error')
  })

  it('returns neutral for a team with no members instead of alarming at 0%', () => {
    expect(getFeeTone(0, 0)).toBe('default')
  })
})
