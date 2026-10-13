import { skills } from '../EventSubscription/profileOptions'
import type { ExperienceType } from '../../services/team-building/team-building.types'

export const experienceLabels: Record<ExperienceType, string> = {
  newbie: 'Encontrista',
  experienced: 'Encontreiro Rosário',
  experienced_outsider: 'Encontreiro',
}

export const experienceFilterOptions = (
  Object.entries(experienceLabels) as [ExperienceType, string][]
).map(([value, label]) => ({ value, label }))

// Two shapes on purpose. The Montagem board and "Solicitar Membros" match
// skills by the rendered area label, which is what their rows carry; the
// subscriptions list filters by the wire value, so a copy edit on a label
// cannot change what that endpoint accepts. Both read the same vocabulary.
export const skillFilterOptions = skills.map((s) => ({ value: s.label, label: s.label }))

export const skillValueFilterOptions = skills.map((s) => ({ value: s.value, label: s.label }))

export type CapacityFilter = 'all' | 'available' | 'full'

export const capacityFilterOptions: { value: CapacityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'available', label: 'Com vagas' },
  { value: 'full', label: 'Cheia' },
]
