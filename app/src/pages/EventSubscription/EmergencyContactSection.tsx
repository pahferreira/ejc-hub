import { Card } from '../../components/Card/Card'
import { Input } from '../../components/Input/Input'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

export function EmergencyContactSection() {
  const contactName = useEventSubscriptionField('emergencyContactName')
  const contactPhone = useEventSubscriptionField('emergencyContactPhone')

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Contato de Emergência</h3>
        <p className="text-sm text-gray-500">Quem devemos contatar em caso de emergência?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome do Contato"
          name="emergencyContactName"
          placeholder="Digite o nome do contato"
          value={contactName.field.value}
          onChange={contactName.field.onChange}
        />
        <Input
          label="Telefone do Contato"
          name="emergencyContactPhone"
          type="tel"
          placeholder="Digite o telefone do contato"
          value={contactPhone.field.value}
          onChange={contactPhone.field.onChange}
        />
      </div>
    </Card>
  )
}
