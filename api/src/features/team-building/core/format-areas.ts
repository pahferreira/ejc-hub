export type SkillFlags = {
  hasActingSkills: boolean
  hasCommunicationSkills: boolean
  hasCookingSkills: boolean
  hasDancingSkills: boolean
  hasManualSkills: boolean
  hasMusicSkills: boolean
  hasSingingSkills: boolean
}

// Read-side inverse of Events#formatSkillsObject: turns the user's skill
// booleans into the inline area labels shown on a board card.
const SKILL_LABELS: { key: keyof SkillFlags; label: string }[] = [
  { key: 'hasMusicSkills', label: 'Toca violão' },
  { key: 'hasSingingSkills', label: 'Canta' },
  { key: 'hasActingSkills', label: 'Atuação' },
  { key: 'hasDancingSkills', label: 'Dança' },
  { key: 'hasCookingSkills', label: 'Cozinha' },
  { key: 'hasManualSkills', label: 'Habilidades Manuais' },
  { key: 'hasCommunicationSkills', label: 'Comunicação' },
]

export function formatAreas(skills: SkillFlags): string[] {
  return SKILL_LABELS.filter(({ key }) => skills[key]).map(({ label }) => label)
}
