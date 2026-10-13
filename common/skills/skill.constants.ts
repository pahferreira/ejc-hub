/**
 * The canonical skill vocabulary, shared by the subscription form, the API's
 * read-side label rendering and the subscriptions list filter.
 *
 * `value` is what travels on the wire — both the subscription payload's
 * `selectedSkills` and the `skills` filter on the subscriptions list — `key` is
 * the matching boolean column on the user, and `label` is the Portuguese text
 * shown on screen. Keeping the three together is what stops a copy edit on a
 * label from silently changing an API contract.
 *
 * Order is the subscription form's question order; the API renders area labels
 * in its own order and says so where it does.
 */
export const SKILLS = [
  { label: 'Atuação', value: 'has_acting_skills', key: 'hasActingSkills' },
  { label: 'Dança', value: 'has_dancing_skills', key: 'hasDancingSkills' },
  { label: 'Canta', value: 'has_singing_skills', key: 'hasSingingSkills' },
  { label: 'Comunicação', value: 'has_communication_skills', key: 'hasCommunicationSkills' },
  { label: 'Habilidades Culinárias', value: 'has_cooking_skills', key: 'hasCookingSkills' },
  { label: 'Papelaria e Confecção Manual', value: 'has_manual_skills', key: 'hasManualSkills' },
  { label: 'Toca violão', value: 'has_guitar_skills', key: 'hasGuitarSkills' },
  { label: 'Toca percussão', value: 'has_percussion_skills', key: 'hasPercussionSkills' },
  { label: 'Toca algum outro instrumento', value: 'has_music_skills', key: 'hasMusicSkills' },
  { label: 'Edição de Vídeo e Mídias', value: 'has_midia_skills', key: 'hasMidiaSkills' },
] as const

export type SkillValue = (typeof SKILLS)[number]['value']

export type SkillKey = (typeof SKILLS)[number]['key']

/** Wire value to user column, for turning a `skills` filter into flag lookups. */
export const SKILL_KEY_BY_VALUE = Object.fromEntries(
  SKILLS.map((skill) => [skill.value, skill.key])
) as Record<SkillValue, SkillKey>

export const SKILL_LABEL_BY_KEY = Object.fromEntries(
  SKILLS.map((skill) => [skill.key, skill.label])
) as Record<SkillKey, string>

/**
 * Encontrista / Encontreiro Rosário / Encontreiro.
 *
 * Distinct from `hasCoordinatorExperience`, which is a separate boolean and is
 * deliberately not part of this vocabulary.
 */
export const EXPERIENCE_TYPES = ['newbie', 'experienced', 'experienced_outsider'] as const

export type ExperienceTypeValue = (typeof EXPERIENCE_TYPES)[number]
