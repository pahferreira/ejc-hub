export const experienceOptions = [
  { label: 'Encontreiro Rosário', value: 'experienced' },
  { label: 'Encontreiro de Outra Paróquia', value: 'experienced_outsider' },
  { label: 'Encontrista Rosário', value: 'newbie' },
]

export const genderOptions = [
  { label: 'Masculino', value: 'male' },
  { label: 'Feminino', value: 'female' },
]

export const circleOptions = [
  { label: 'Vermelho', value: 'red' },
  { label: 'Verde', value: 'green' },
  { label: 'Azul', value: 'blue' },
]

// Single source of truth for skill options: `value` is the snake_case form
// value sent to the API, `key` is the matching camelCase flag on the user.
// The API's format-areas.ts renders these same labels on board cards/drawers.
export const skills = [
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

export const availability = [
  { label: 'Segunda-feira', value: 'monday' },
  { label: 'Terça-feira', value: 'tuesday' },
  { label: 'Quarta-feira', value: 'wednesday' },
  { label: 'Quinta-feira', value: 'thursday' },
  { label: 'Sexta-feira', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' },
]

export function getOptionLabel(
  value: string,
  options: readonly { label: string; value: string }[]
) {
  return options.find((option) => option.value === value)?.label ?? value
}
