import { Input } from '../../../../components/Input/Input'
import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionField } from '../../useEventSubscriptionForm'

export function PersonalDataStep() {
  const fullName = useEventSubscriptionField('fullName')
  const email = useEventSubscriptionField('email')
  const phone = useEventSubscriptionField('phone')
  const nickname = useEventSubscriptionField('nickname')
  const contactName = useEventSubscriptionField('emergencyContactName')
  const contactPhone = useEventSubscriptionField('emergencyContactPhone')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Informações Pessoais"
          description="Por favor, forneça seus dados pessoais"
        />
        <Input
          label="Nome Completo"
          name="fullName"
          placeholder="Digite seu nome completo"
          value={fullName.field.value}
          onChange={fullName.field.onChange}
          error={fullName.fieldState.error?.message}
        />
        <Input
          label="Apelido"
          name="nickname"
          placeholder="Digite seu apelido"
          value={nickname.field.value}
          onChange={nickname.field.onChange}
          error={nickname.fieldState.error?.message}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            placeholder="Digite seu telefone"
            value={phone.field.value}
            onChange={phone.field.onChange}
            error={phone.fieldState.error?.message}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Digite seu email"
            value={email.field.value}
            onChange={email.field.onChange}
            error={email.fieldState.error?.message}
          />
        </div>
      </div>
      <hr className="border-t border-secondary" />
      <div className="flex flex-col gap-4">
        <SectionTitle
          title="Contato de Emergência"
          description="Quem devemos contatar em caso de emergência?"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome do Contato"
            name="emergencyContactName"
            placeholder="Digite o nome do contato"
            value={contactName.field.value}
            onChange={contactName.field.onChange}
            error={contactName.fieldState.error?.message}
          />
          <Input
            label="Telefone do Contato"
            name="emergencyContactPhone"
            type="tel"
            placeholder="Digite o telefone do contato"
            value={contactPhone.field.value}
            onChange={contactPhone.field.onChange}
            error={contactPhone.fieldState.error?.message}
          />
        </div>
      </div>
    </div>
  )
}
