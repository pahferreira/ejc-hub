export type SkillFlags = {
  hasActingSkills: boolean
  hasCommunicationSkills: boolean
  hasCookingSkills: boolean
  hasDancingSkills: boolean
  hasManualSkills: boolean
  hasMusicSkills: boolean
  hasSingingSkills: boolean
  hasGuitarSkills: boolean
  hasPercussionSkills: boolean
  hasMidiaSkills: boolean
}

// Read-side inverse of Events#formatSkillsObject: turns the user's skill
// booleans into the inline area labels shown on a board card. Labels must
// match the subscription form options in app profileOptions.ts.
const SKILL_LABELS: { key: keyof SkillFlags; label: string }[] = [
  { key: 'hasMusicSkills', label: 'Toca algum outro instrumento' },
  { key: 'hasGuitarSkills', label: 'Toca violão' },
  { key: 'hasPercussionSkills', label: 'Toca percussão' },
  { key: 'hasSingingSkills', label: 'Canta' },
  { key: 'hasActingSkills', label: 'Atuação' },
  { key: 'hasDancingSkills', label: 'Dança' },
  { key: 'hasCookingSkills', label: 'Habilidades Culinárias' },
  { key: 'hasManualSkills', label: 'Papelaria e Confecção Manual' },
  { key: 'hasCommunicationSkills', label: 'Comunicação' },
  { key: 'hasMidiaSkills', label: 'Edição de Vídeo e Mídias' },
]

export function formatAreas(skills: SkillFlags): string[] {
  return SKILL_LABELS.filter(({ key }) => skills[key]).map(({ label }) => label)
}
