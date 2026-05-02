export const experienceOptions = [
  { label: 'Encontreiro Rosário', value: 'experienced' },
  { label: 'Encontreiro de Outra Paróquia', value: 'experienced_outsider' },
  { label: 'Encontrista Rosário', value: 'newbie' },
]

export const circleOptions = [
  { label: 'Vermelho', value: 'red' },
  { label: 'Verde', value: 'green' },
  { label: 'Azul', value: 'blue' },
]

export const skills = [
  { label: 'Atuação', value: 'has_acting_skills' },
  { label: 'Dança', value: 'has_dancing_skills' },
  { label: 'Canta', value: 'has_singing_skills' },
  { label: 'Comunicação', value: 'has_communication_skills' },
  { label: 'Sabe cozinhar', value: 'has_cooking_skills' },
  { label: 'Habilidades manuais', value: 'has_manual_skills' },
  { label: 'Toca um instrumento', value: 'has_music_skills' },
]

export const availability = [
  { label: 'Segunda-feira', value: 'monday' },
  { label: 'Terça-feira', value: 'tuesday' },
  { label: 'Quarta-feira', value: 'wednesday' },
  { label: 'Quinta-feira', value: 'thursday' },
  { label: 'Sexta-feira', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' },
]

export function getOptionLabel(value: string, options: { label: string; value: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value
}
