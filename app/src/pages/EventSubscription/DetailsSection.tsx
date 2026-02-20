import { Card } from '../../components/Card/Card'
import { TextArea } from '../../components/TextArea/TextArea'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

export function DetailsSection() {
  const details = useEventSubscriptionField('details')

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Informações Adicionais</h3>
          <p className="text-sm text-gray-500">
            Qualquer informação que possa ser relevante para a montagem
          </p>
        </div>
        <TextArea
          label="Observações"
          name="details"
          value={details.field.value}
          onChange={details.field.onChange}
        />
      </div>
    </Card>
  )
}
