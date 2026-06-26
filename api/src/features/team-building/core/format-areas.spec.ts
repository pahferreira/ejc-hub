import { describe, it, expect } from 'vitest'
import { formatAreas, type SkillFlags } from './format-areas.ts'

const noSkills: SkillFlags = {
  hasActingSkills: false,
  hasCommunicationSkills: false,
  hasCookingSkills: false,
  hasDancingSkills: false,
  hasManualSkills: false,
  hasMusicSkills: false,
  hasSingingSkills: false,
}

describe('formatAreas', () => {
  it('returns an empty list when the member has no skills', () => {
    expect(formatAreas(noSkills)).toEqual([])
  })

  it('maps active skills to their labels in a stable order', () => {
    expect(formatAreas({ ...noSkills, hasSingingSkills: true, hasMusicSkills: true })).toEqual([
      'Toca violão',
      'Canta',
    ])
  })
})
