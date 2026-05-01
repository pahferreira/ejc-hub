import { SectionTitle } from '../../../components/SectionTitle/SectionTitle'
import { TextArea } from '../../../components/TextArea/TextArea'
import { useEventSubscriptionField } from '../useEventSubscriptionForm'

export function AdditionalInfoStep() {
  const details = useEventSubscriptionField('details')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionTitle
          title="Informações Adicionais"
          description="Qualquer informação que possa ser relevante para a montagem"
        />
      </div>
      <TextArea
        label="Observações"
        name="details"
        value={details.field.value}
        onChange={details.field.onChange}
      />
    </div>
  )
}
