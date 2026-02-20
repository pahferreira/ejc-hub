import { Card } from '../../components/Card/Card'
import { Checkbox } from '../../components/Checkbox/Checkbox'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

const skills = [
  {
    label: 'Atuação',
    value: 'has_acting_skills',
  },
  {
    label: 'Dança',
    value: 'has_dancing_skills',
  },
  {
    label: 'Canta',
    value: 'has_singing_skills',
  },
  {
    label: 'Comunicação',
    value: 'has_communication_skills',
  },
  {
    label: 'Sabe cozinhar',
    value: 'has_cooking_skills',
  },
  {
    label: 'Habilidades manuais',
    value: 'has_manual_skills',
  },
  {
    label: 'Toca um instrumento',
    value: 'has_music_skills',
  },
]

export function SkillsSection() {
  const selectedSkills = useEventSubscriptionField('selectedSkills')

  const toggle = (skill: string) => {
    const current = selectedSkills.field.value
    const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]
    selectedSkills.field.onChange(next)
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-900">Suas Habilidades</h3>
        <p className="text-sm text-gray-500">
          Selecione as habilidades que melhor descrevem sua experiência
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {skills.map((skill) => (
            <Checkbox
              key={skill.value}
              label={skill.label}
              checked={selectedSkills.field.value.includes(skill.value)}
              onChange={() => toggle(skill.value)}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
