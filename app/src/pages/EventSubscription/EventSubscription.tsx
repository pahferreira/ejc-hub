import { Button } from '../../components/Button/Button'
import { EventSubscriptionProvider } from './useEventSubscriptionForm'
import { PersonalInformationSection } from './PersonalInformationSection'
import { EmergencyContactSection } from './EmergencyContactSection'
import { PreviousExperienceSection } from './PreviousExperienceSection'
import { SkillsSection } from './SkillsSection'
import { TeamSelectionSection } from './TeamSelectionSection'
import { useEventSubscriptionForm } from './useEventSubscriptionForm'
import type { EventSubscriptionFormData } from './useEventSubscriptionForm'

function EventSubscriptionForm() {
  const form = useEventSubscriptionForm()

  const onSubmit = (data: EventSubscriptionFormData) => {
    console.log('Form submitted:', data)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Participe do Nosso Evento</h1>
        <p className="mt-2 text-gray-500">
          Preencha seus dados e selecione suas equipes preferidas
        </p>
      </div>
      <div className="flex flex-col gap-6 text-left">
        <PersonalInformationSection />
        <EmergencyContactSection />
        <PreviousExperienceSection />
        <SkillsSection />
        <TeamSelectionSection />
        <Button variant="secondary" onClick={form.handleSubmit(onSubmit)}>
          Inscrever-se no Evento
        </Button>
      </div>
    </div>
  )
}

export function EventSubscription() {
  return (
    <EventSubscriptionProvider>
      <EventSubscriptionForm />
    </EventSubscriptionProvider>
  )
}
