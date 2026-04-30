import { PreviousExperienceSection } from '../../PreviousExperienceSection'
import { SkillsSection } from '../../SkillsSection'
import { AvailabilitySection } from '../../AvailabilitySection'

type ProfileStepProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function ProfileStep(props: ProfileStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <PreviousExperienceSection teamOptions={props.teamOptions} />
      <SkillsSection />
      <AvailabilitySection />
    </div>
  )
}
