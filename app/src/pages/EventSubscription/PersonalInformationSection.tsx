import { Card } from '../../components/Card/Card'
import { Input } from '../../components/Input/Input'
import { useEventSubscriptionField } from './useEventSubscriptionForm'

export function PersonalInformationSection() {
  const fullName = useEventSubscriptionField('fullName')
  const email = useEventSubscriptionField('email')
  const phone = useEventSubscriptionField('phone')
  const nickname = useEventSubscriptionField('nickname')

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Informações Pessoais</h3>
          <p className="text-sm text-gray-500">Por favor, forneça seus dados de contato</p>
        </div>
        <Input
          label="Nome Completo"
          name="fullName"
          placeholder="Digite seu nome completo"
          value={fullName.field.value}
          onChange={fullName.field.onChange}
        />
        <Input
          label="Apelido"
          name="nickname"
          placeholder="Digite seu apelido"
          value={nickname.field.value}
          onChange={nickname.field.onChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            placeholder="Digite seu telefone"
            value={phone.field.value}
            onChange={phone.field.onChange}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Digite seu email"
            value={email.field.value}
            onChange={email.field.onChange}
          />
        </div>
      </div>
    </Card>
  )
}
