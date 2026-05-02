import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { AdditionalInfoReview } from './AdditionalInfoReview'
import { PersonalDataReview } from './PersonalDataReview'
import { ProfileReview } from './ProfileReview'
import { TeamsReview } from './TeamsReview'

type ConfirmationStepProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function ConfirmationStep(props: ConfirmationStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Confirmação" description="Revise seus dados antes de enviar" />
      <PersonalDataReview />
      <hr className="border-t border-secondary" />
      <ProfileReview teamOptions={props.teamOptions} />
      <hr className="border-t border-secondary" />
      <TeamsReview teamOptions={props.teamOptions} />
      <hr className="border-t border-secondary" />
      <AdditionalInfoReview />
    </div>
  )
}
