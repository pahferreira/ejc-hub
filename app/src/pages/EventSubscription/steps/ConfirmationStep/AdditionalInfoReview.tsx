import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionForm } from '../../useEventSubscriptionForm'
import { ReviewField } from './ReviewField'

export function AdditionalInfoReview() {
  const form = useEventSubscriptionForm()
  const details = form.watch('details')
  const workingAnotherEvent = form.watch('workingAnotherEvent')

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title="Observações" />
      <ReviewField label="Informações Adicionais" value={details} />
      <ReviewField label="Servindo em outros lugares" value={workingAnotherEvent ? 'Sim' : 'Não'} />
    </div>
  )
}
