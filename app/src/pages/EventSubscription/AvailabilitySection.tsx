import { Card } from '../../components/Card/Card'
import { Checkbox } from '../../components/Checkbox/Checkbox'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

const availability = [
  {
    label: 'Segunda-feira',
    value: 'monday',
  },
  {
    label: 'Terça-feira',
    value: 'tuesday',
  },
  {
    label: 'Quarta-feira',
    value: 'wednesday',
  },
  {
    label: 'Quinta-feira',
    value: 'thursday',
  },
  {
    label: 'Sexta-feira',
    value: 'friday',
  },
  {
    label: 'Sábado',
    value: 'saturday',
  },
  {
    label: 'Domingo',
    value: 'sunday',
  },
]

export function AvailabilitySection() {
  const selectedAvailability = useEventSubscriptionField('selectedAvailability')

  const toggle = (day: string) => {
    const current = selectedAvailability.field.value
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    selectedAvailability.field.onChange(next)
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-gray-900">Sua disponibilidade durante a semana</h3>
        <p className="text-sm text-gray-500">
          Dia de semanas contam como disponíveis apenas o horário da noite (após as 19h) e finais de
          semana contam como disponíveis a maior parte do dia.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availability.map((day) => (
            <Checkbox
              key={day.value}
              label={day.label}
              checked={selectedAvailability.field.value.includes(day.value)}
              onChange={() => toggle(day.value)}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
