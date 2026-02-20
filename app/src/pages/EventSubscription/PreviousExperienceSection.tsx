import { Card } from '../../components/Card/Card'
import { Checkbox } from '../../components/Checkbox/Checkbox'
import { RadioGroup } from '../../components/RadioGroup/RadioGroup'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

const ExperienceValue = {
  Yes: 'yes',
  No: 'no',
} as const

const experienceOptions = [
  { label: 'Sim', value: ExperienceValue.Yes },
  { label: 'Não', value: ExperienceValue.No },
]

type PreviousExperienceSectionProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function PreviousExperienceSection(props: PreviousExperienceSectionProps) {
  const experience = useEventSubscriptionField('hasPreviousExperience')
  const selectedPreviousExpTeams = useEventSubscriptionField('selectedPreviousExperienceTeams')
  const hasCoordinatorExperience = useEventSubscriptionField('hasCoordinatorExperience')

  const toggle = (teamKey: string) => {
    const current = selectedPreviousExpTeams.field.value
    const next = current.includes(teamKey)
      ? current.filter((t) => t !== teamKey)
      : [...current, teamKey]
    selectedPreviousExpTeams.field.onChange(next)
  }

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Experiência Anterior</h3>
      <RadioGroup
        label="Você já serviu em algum Encontro de Jovens com Cristo antes?"
        description="Conte-nos sobre sua experiência anterior"
        options={experienceOptions}
        selected={experience.field.value}
        onChange={experience.field.onChange}
        variant="stacked"
      />
      {experience.field.value === ExperienceValue.Yes && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Selecione as equipes em que você já serviu:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3 mb-4">
            {props.teamOptions.map((team) => (
              <Checkbox
                key={team.key}
                label={team.name}
                checked={selectedPreviousExpTeams.field.value.includes(team.key)}
                onChange={() => toggle(team.key)}
              />
            ))}
          </div>
          <RadioGroup
            label="Você já coordenou alguma equipe do EJC?"
            description="Conte-nos sobre sua experiência coordenando"
            options={experienceOptions}
            selected={hasCoordinatorExperience.field.value}
            onChange={hasCoordinatorExperience.field.onChange}
            variant="stacked"
          />
        </div>
      )}
    </Card>
  )
}
