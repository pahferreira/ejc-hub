import type { ExperienceType } from '../../services/team-building/team-building.types'

type ExperienceOption = { label: string; variant: 'green' | 'blue' | 'red' }

export const experienceLabels: Record<ExperienceType, ExperienceOption> = {
  newbie: { label: 'Encontrista', variant: 'green' },
  experienced: { label: 'Encontreiro Rosário', variant: 'blue' },
  experienced_outsider: { label: 'Encontreiro', variant: 'red' },
}

export const experienceFilterOptions = (
  Object.entries(experienceLabels) as [ExperienceType, ExperienceOption][]
).map(([value, option]) => ({ value, label: option.label }))

export type CapacityFilter = 'all' | 'available' | 'full'

export const capacityFilterOptions: { value: CapacityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'available', label: 'Com vagas' },
  { value: 'full', label: 'Cheia' },
]
