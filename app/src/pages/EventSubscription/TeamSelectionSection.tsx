import { Card } from '../../components/Card/Card'
import { TeamBox } from '../../components/TeamBox/TeamBox'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

const MAX_TEAMS = 3

type TeamSelectionSectionProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function TeamSelectionSection(props: TeamSelectionSectionProps) {
  const selectedTeams = useEventSubscriptionField('selectedTeams')
  const selectedCount = selectedTeams.field.value.length
  const isMaxSelected = selectedCount >= MAX_TEAMS

  const toggle = (teamId: string) => {
    const current = selectedTeams.field.value
    if (current.includes(teamId)) {
      selectedTeams.field.onChange(current.filter((t) => t !== teamId))
    } else if (!isMaxSelected) {
      selectedTeams.field.onChange([...current, teamId])
    }
  }

  return (
    <Card>
      <div className="grid gap-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900">Escolha Suas Equipes Preferidas</h3>
          <span className="text-sm text-gray-500 text-right">
            {selectedCount}/{MAX_TEAMS} selecionadas
          </span>
        </div>
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          Você pode selecionar até {MAX_TEAMS} equipes. Escolha as que melhor combinam com seus
          interesses e habilidades.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              />
            )
          })}
        </div>
      </div>
    </Card>
  )
}
