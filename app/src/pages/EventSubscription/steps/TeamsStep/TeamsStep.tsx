import { TeamSelectionSection } from '../../TeamSelectionSection'

type TeamsStepProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function TeamsStep(props: TeamsStepProps) {
  return (
    <div>
      <TeamSelectionSection teamOptions={props.teamOptions} />
    </div>
  )
}
