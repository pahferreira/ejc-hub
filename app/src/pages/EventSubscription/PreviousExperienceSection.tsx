import { Card } from '../../components/Card/Card'
import { RadioGroup } from '../../components/RadioGroup/RadioGroup'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

const experienceOptions = [
  { label: 'Sim', value: 'yes' },
  { label: 'Não', value: 'no' },
]

export function PreviousExperienceSection() {
  const experience = useEventSubscriptionField('hasPreviousExperience')

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Experiência Anterior</h3>
      <RadioGroup
        label="Você já participou de eventos antes?"
        description="Conte-nos sobre sua experiência anterior"
        options={experienceOptions}
        selected={experience.field.value}
        onChange={experience.field.onChange}
        variant="stacked"
      />
    </Card>
  )
}
