import { SKILLS } from '../../../../common/skills'

export const experienceOptions = [
  { label: 'Encontreiro Rosário', value: 'experienced' },
  { label: 'Encontreiro de Outra Paróquia', value: 'experienced_outsider' },
  { label: 'Encontrista Rosário', value: 'newbie' },
]

export const genderOptions = [
  { label: 'Masculino', value: 'male' },
  { label: 'Feminino', value: 'female' },
]

// The skill vocabulary lives in common/ because the API filters and renders by
// it too: `value` is the snake_case form value sent to the API, `key` the
// matching camelCase flag on the user.
export const skills = SKILLS

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
