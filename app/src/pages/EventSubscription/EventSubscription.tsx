import { Button } from '../../components/Button/Button'
import { EventSubscriptionProvider } from './useEventSubscriptionForm'
import { PersonalInformationSection } from './PersonalInformationSection'
import { EmergencyContactSection } from './EmergencyContactSection'
import { PreviousExperienceSection } from './PreviousExperienceSection'
import { SkillsSection } from './SkillsSection'
import { TeamSelectionSection } from './TeamSelectionSection'
import { useEventSubscriptionForm } from './useEventSubscriptionForm'
import type { EventSubscriptionFormData } from './useEventSubscriptionForm'
import { AvailabilitySection } from './AvailabilitySection'
import { DetailsSection } from './DetailsSection'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import { useCreateEventSubscriptionMutation } from '../../services/events/useCreateEventSubscriptionMutation'

function EventSubscriptionForm() {
  const form = useEventSubscriptionForm()
  const teamOptions = useTeamOptionsQuery()
  const createEventSubscription = useCreateEventSubscriptionMutation()

  const onSubmit = async (data: EventSubscriptionFormData) => {
    const payload = {
      ...data,
      isNewbie: data.hasPreviousExperience === 'no',
      hasCoordinatorExperience: data.hasCoordinatorExperience === 'yes',
      availability: data.selectedAvailability,
      previousExperienceTeams: data.selectedPreviousExperienceTeams,
    }

    const response = await createEventSubscription.mutateAsync(payload)

    if (response.status === 200 && response.data.id) {
      // TODO: Show success message and redirect to confirmation page
      alert('Inscrição realizada com sucesso!')
    }
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
        <PreviousExperienceSection teamOptions={teamOptions.data ?? []} />
        <SkillsSection />
        <AvailabilitySection />
        <TeamSelectionSection teamOptions={teamOptions.data ?? []} />
        <DetailsSection />
        <Button
          variant="secondary"
          onClick={form.handleSubmit(onSubmit)}
          disabled={createEventSubscription.isPending}
        >
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
