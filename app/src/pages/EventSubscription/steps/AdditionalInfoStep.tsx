import { Checkbox } from '../../../components/Checkbox/Checkbox'
import { SectionTitle } from '../../../components/SectionTitle/SectionTitle'
import { TextArea } from '../../../components/TextArea/TextArea'
import { useEventSubscriptionField } from '../useEventSubscriptionForm'

export function AdditionalInfoStep() {
  const details = useEventSubscriptionField('details')
  const workingAnotherEvent = useEventSubscriptionField('workingAnotherEvent')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Servindo em outros lugares"
          description="Você está envolvido em outros EJCs que possam atrapalhar a preparação deste encontro?"
        />
        <Checkbox
          label="Sim, estarei participando de outros EJCs durante essa preparação"
          checked={workingAnotherEvent.field.value ?? false}
          onChange={workingAnotherEvent.field.onChange}
        />
      </div>
      <hr className="border-t border-secondary" />
      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Informações Adicionais"
          description="Qualquer informação que possa ser relevante para a montagem"
        />
        <TextArea
          label="Observações"
          name="details"
          value={details.field.value}
          onChange={details.field.onChange}
        />
      </div>
    </div>
  )
}
