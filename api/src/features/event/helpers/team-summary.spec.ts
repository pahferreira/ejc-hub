import { describe, it, expect } from 'vitest'
import { getTeamSummaryBucket } from './team-summary.ts'

describe('getTeamSummaryBucket', () => {
  it('returns inRisk when capacity is not configured', () => {
    expect(getTeamSummaryBucket(0, 0)).toBe('inRisk')
    expect(getTeamSummaryBucket(3, 0)).toBe('inRisk')
  })

  it('returns completed when the team is full or over capacity', () => {
    expect(getTeamSummaryBucket(10, 10)).toBe('completed')
    expect(getTeamSummaryBucket(11, 10)).toBe('completed')
  })

  it('returns inRisk below 50% filled', () => {
    expect(getTeamSummaryBucket(0, 10)).toBe('inRisk')
    expect(getTeamSummaryBucket(4, 10)).toBe('inRisk')
  })

  it('returns partiallyCompleted from 50% up to but not including full', () => {
    expect(getTeamSummaryBucket(5, 10)).toBe('partiallyCompleted')
    expect(getTeamSummaryBucket(9, 10)).toBe('partiallyCompleted')
  })
})
