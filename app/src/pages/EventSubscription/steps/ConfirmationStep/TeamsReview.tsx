import { Badge } from '../../../../components/Badge/Badge'
import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionForm } from '../../useEventSubscriptionForm'

type TeamsReviewProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function TeamsReview(props: TeamsReviewProps) {
  const form = useEventSubscriptionForm()
  const selectedTeams = form.watch('selectedTeams')

  const teamLabels = selectedTeams.map(
    (key) => props.teamOptions.find((team) => team.key === key)?.name ?? key
  )

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title="Equipes Escolhidas" />
      <div className="flex flex-wrap gap-2">
        {teamLabels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))}
      </div>
    </div>
  )
}
