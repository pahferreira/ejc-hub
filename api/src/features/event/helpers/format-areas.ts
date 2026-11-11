import { SKILL_LABEL_BY_KEY, type SkillKey } from '../../../../../common/skills/skill.constants.ts'

export type SkillFlags = Record<SkillKey, boolean>

// Read-side inverse of Events#formatSkillsObject: turns the user's skill
// booleans into the inline area labels shown on a board card. The labels come
// from the shared vocabulary, so they cannot drift from the subscription form;
// only the order below belongs to this screen.
const SKILL_DISPLAY_ORDER: SkillKey[] = [
  'hasMusicSkills',
  'hasGuitarSkills',
  'hasPercussionSkills',
  'hasSingingSkills',
  'hasActingSkills',
  'hasDancingSkills',
  'hasCookingSkills',
  'hasManualSkills',
  'hasCommunicationSkills',
  'hasMidiaSkills',
]

export function formatAreas(skills: SkillFlags): string[] {
  return SKILL_DISPLAY_ORDER.filter((key) => skills[key]).map((key) => SKILL_LABEL_BY_KEY[key])
}
