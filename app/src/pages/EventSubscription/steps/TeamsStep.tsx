import { TeamBox } from '../../../components/TeamBox/TeamBox'
import { useEventSubscriptionField } from '../useEventSubscriptionForm'

type TeamsStepProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

const MAX_TEAMS = 3

export function TeamsStep(props: TeamsStepProps) {
  const selectedTeams = useEventSubscriptionField('selectedTeams')
  const selectedCount = selectedTeams.field.value.length
  const isMaxSelected = selectedCount >= MAX_TEAMS

  const toggle = (teamId: string) => {
    const current = selectedTeams.field.value
    if (current.includes(teamId)) {
      selectedTeams.field.onChange(current.filter((t: string) => t !== teamId))
    } else if (!isMaxSelected) {
      selectedTeams.field.onChange([...current, teamId])
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-bold text-gray-900">Escolha Suas Equipes Preferidas</h3>
        <span className="text-sm text-gray-500 text-right">
          {selectedCount}/{MAX_TEAMS} selecionadas
        </span>
      </div>
      <div className="rounded-md bg-primary p-3 text-sm text-white">
        Você pode selecionar até {MAX_TEAMS} equipes. Escolha as que melhor combinam com seus
        interesses e habilidades.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {props.teamOptions.map((team) => {
          const isSelected = selectedTeams.field.value.includes(team.key)
          return (
            <TeamBox
              key={team.key}
              title={team.name}
              description={team.description}
              selected={isSelected}
              disabled={!isSelected && isMaxSelected}
              onToggle={() => toggle(team.key)}
              error={Boolean(selectedTeams.fieldState.error?.message) && !isSelected}
            />
          )
        })}
      </div>
      {selectedTeams.fieldState.error?.message && (
        <p className="text-sm text-red-500">{selectedTeams.fieldState.error.message}</p>
      )}
    </div>
  )
}
