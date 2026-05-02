import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionForm } from '../../useEventSubscriptionForm'
import { ReviewField } from './ReviewField'

export function AdditionalInfoReview() {
  const form = useEventSubscriptionForm()
  const details = form.watch('details')

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title="Observações" />
      <ReviewField label="Informações Adicionais" value={details} />
    </div>
  )
}
