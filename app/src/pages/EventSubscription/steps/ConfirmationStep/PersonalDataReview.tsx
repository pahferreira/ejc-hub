import { SectionTitle } from '../../../../components/SectionTitle/SectionTitle'
import { useEventSubscriptionForm } from '../../useEventSubscriptionForm'
import { ReviewField } from './ReviewField'

export function PersonalDataReview() {
  const form = useEventSubscriptionForm()
  const values = form.watch()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle title="Dados Pessoais" />
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Nome Completo" value={values.fullName} />
          <ReviewField label="Apelido" value={values.nickname} />
          <ReviewField label="Email" value={values.email} />
          <ReviewField label="Telefone" value={values.phone} />
        </dl>
      </div>
      <div className="flex flex-col gap-4">
        <SectionTitle title="Contato de Emergência" />
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Nome do Contato" value={values.emergencyContactName} />
          <ReviewField label="Telefone do Contato" value={values.emergencyContactPhone} />
        </dl>
      </div>
    </div>
  )
}
