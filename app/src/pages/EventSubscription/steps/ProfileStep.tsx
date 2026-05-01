import { Checkbox } from '../../../components/Checkbox/Checkbox'
import { RadioGroup } from '../../../components/RadioGroup/RadioGroup'
import { SectionTitle } from '../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionField } from '../useEventSubscriptionForm'

const experienceOptions = [
  { label: 'Encontreiro Rosário', value: 'experienced' },
  { label: 'Encontreiro de Outra Paróquia', value: 'experienced_outsider' },
  { label: 'Encontrista Rosário', value: 'newbie' },
]

const circleOptions = [
  { label: 'Vermelho', value: 'red' },
  { label: 'Verde', value: 'green' },
  { label: 'Azul', value: 'blue' },
]

const skills = [
  { label: 'Atuação', value: 'has_acting_skills' },
  { label: 'Dança', value: 'has_dancing_skills' },
  { label: 'Canta', value: 'has_singing_skills' },
  { label: 'Comunicação', value: 'has_communication_skills' },
  { label: 'Sabe cozinhar', value: 'has_cooking_skills' },
  { label: 'Habilidades manuais', value: 'has_manual_skills' },
  { label: 'Toca um instrumento', value: 'has_music_skills' },
]

const availability = [
  { label: 'Segunda-feira', value: 'monday' },
  { label: 'Terça-feira', value: 'tuesday' },
  { label: 'Quarta-feira', value: 'wednesday' },
  { label: 'Quinta-feira', value: 'thursday' },
  { label: 'Sexta-feira', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' },
]

type ProfileStepProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function ProfileStep(props: ProfileStepProps) {
  const experienceType = useEventSubscriptionField('experienceType')
  const circle = useEventSubscriptionField('circle')
  const hasCoordinatorExperience = useEventSubscriptionField('hasCoordinatorExperience')
  const selectedSkills = useEventSubscriptionField('selectedSkills')
  const selectedAvailability = useEventSubscriptionField('selectedAvailability')
  const selectedPreviousExperienceTeams = useEventSubscriptionField(
    'selectedPreviousExperienceTeams'
  )

  const isNewbie = experienceType.field.value === 'newbie'
  const hasServed = !isNewbie && Boolean(experienceType.field.value)

  const toggleSkill = (value: string) => {
    const current = selectedSkills.field.value ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    selectedSkills.field.onChange(next)
  }

  const toggleAvailability = (value: string) => {
    const current = selectedAvailability.field.value ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    selectedAvailability.field.onChange(next)
  }

  const togglePreviousTeam = (value: string) => {
    const current = selectedPreviousExperienceTeams.field.value ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    selectedPreviousExperienceTeams.field.onChange(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle title="Perfil" description="Experiência e habilidades" />
        <RadioGroup
          label="Experiência com EJC"
          options={experienceOptions}
          selected={experienceType.field.value}
          onChange={experienceType.field.onChange}
          variant="stacked"
        />
        {experienceType.fieldState.error?.message && (
          <p className="text-sm text-red-500">{experienceType.fieldState.error.message}</p>
        )}
        {isNewbie && (
          <div className="flex flex-col gap-2">
            <RadioGroup
              label="Qual círculo você participou?"
              options={circleOptions}
              selected={circle.field.value}
              onChange={circle.field.onChange}
              variant="inline"
            />
            {circle.fieldState.error?.message && (
              <p className="text-sm text-red-500">{circle.fieldState.error.message}</p>
            )}
          </div>
        )}
        {hasServed && (
          <div className="flex flex-col gap-4">
            <SectionTitle
              title="Experiências Anteriores"
              description="Conte-nos um pouco mais sobre suas experiências com o EJC."
            />
            <Checkbox
              label="Tenho experiência como coordenador/líder de equipe"
              checked={hasCoordinatorExperience.field.value}
              onChange={hasCoordinatorExperience.field.onChange}
            />
            <p className="text-sm text-black font-bold">Em quais equipes você já participou?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {props.teamOptions.map((team) => (
                <Checkbox
                  key={team.key}
                  label={team.name}
                  checked={selectedPreviousExperienceTeams.field.value?.includes(team.key) ?? false}
                  onChange={() => togglePreviousTeam(team.key)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <hr className="border-t border-secondary" />

      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Habilidades"
          description="Selecione as habilidades que melhor descrevem sua experiência"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {skills.map((skill) => (
            <Checkbox
              key={skill.value}
              label={skill.label}
              checked={selectedSkills.field.value?.includes(skill.value) ?? false}
              onChange={() => toggleSkill(skill.value)}
            />
          ))}
        </div>
      </div>

      <hr className="border-t border-secondary" />

      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Sua disponibilidade durante a semana"
          description="Dia de semana contam como disponíveis apenas o horário da noite (após as 19h) e finais de semana contam como disponíveis a maior parte do dia."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availability.map((day) => (
            <Checkbox
              key={day.value}
              label={day.label}
              checked={selectedAvailability.field.value?.includes(day.value) ?? false}
              onChange={() => toggleAvailability(day.value)}
              error={Boolean(selectedAvailability.fieldState.error)}
            />
          ))}
        </div>
        {selectedAvailability.fieldState.error?.message && (
          <p className="text-sm text-red-500">{selectedAvailability.fieldState.error.message}</p>
        )}
      </div>
    </div>
  )
}
