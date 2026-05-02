import { EventSubscriptionProvider } from './useEventSubscriptionForm'
import { useEventSubscriptionForm } from './useEventSubscriptionForm'
import type { EventSubscriptionFormOutput } from './useEventSubscriptionForm'
import { SubscriptionWizardProvider, useSubscriptionWizard, STEPS } from './useSubscriptionWizard'
import {
  useSubscriptionFormPersistence,
  updatePersistedStep,
} from './useSubscriptionFormPersistence'
import { WizardStepper } from '../../components/WizardStepper'
import { WizardFooter } from '../../components/WizardFooter'
import { PersonalDataStep } from './steps/PersonalDataStep'
import { ProfileStep } from './steps/ProfileStep'
import { TeamsStep } from './steps/TeamsStep'
import { ConfirmationStep } from './steps/ConfirmationStep'
import { Card } from '../../components/Card/Card'
import { useTeamOptionsQuery } from '../../services/teams/useTeamOptionsQuery'
import { useCreateEventSubscriptionMutation } from '../../services/events/useCreateEventSubscriptionMutation'
import { toastPromise } from '../../utils/toast/toast'
import { AdditionalInfoStep } from './steps/AdditionalInfoStep'

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  personal: 'Dados Pessoais',
  profile: 'Perfil',
  teams: 'Equipes',
  additional: 'Observações',
  confirm: 'Confirmação',
}

const wizardSteps = STEPS.map((id) => ({ id, label: STEP_LABELS[id] }))

type EventSubscriptionFormProps = {
  clearPersistence: () => void
}

function EventSubscriptionForm(props: EventSubscriptionFormProps) {
  const form = useEventSubscriptionForm()
  const teamOptions = useTeamOptionsQuery()
  const createEventSubscription = useCreateEventSubscriptionMutation()
  const { currentStep, isFirst, isLast, isNavigating, maxReachedStep, goNext, goPrev, goTo } =
    useSubscriptionWizard()

  const onSubmit = async (data: EventSubscriptionFormOutput) => {
    const response = createEventSubscription.mutateAsync(data)
    toastPromise(response, {
      message: 'Inscrição realizada com sucesso!',
      callback: () => {
        props.clearPersistence()
        form.reset()
      },
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Participe do Nosso Evento</h1>
        <p className="mt-2 text-gray-500">
          Preencha seus dados e selecione suas equipes preferidas
        </p>
      </div>
      <WizardStepper
        steps={wizardSteps}
        currentStep={currentStep}
        maxReachedStepIndex={maxReachedStep}
        onStepClick={goTo}
      />
      <Card className="!bg-tertiary/50 ">
        <div className="flex flex-col gap-6 text-left">
          {currentStep === 'personal' && <PersonalDataStep />}
          {currentStep === 'profile' && <ProfileStep teamOptions={teamOptions.data ?? []} />}
          {currentStep === 'teams' && <TeamsStep teamOptions={teamOptions.data ?? []} />}
          {currentStep === 'additional' && <AdditionalInfoStep />}
          {currentStep === 'confirm' && <ConfirmationStep teamOptions={teamOptions.data ?? []} />}
          <WizardFooter
            isFirst={isFirst}
            isLast={isLast}
            isNavigating={isNavigating}
            isSubmitting={form.formState.isSubmitting}
            onBack={goPrev}
            onNext={goNext}
            onSubmit={form.handleSubmit(onSubmit)}
          />
        </div>
      </Card>
    </div>
  )
}

function EventSubscriptionWizardShell() {
  const form = useEventSubscriptionForm()
  const { initialStep, clearPersistence } = useSubscriptionFormPersistence(form)

  return (
    <SubscriptionWizardProvider
      initialStep={initialStep ?? undefined}
      onStepChange={updatePersistedStep}
    >
      <EventSubscriptionForm clearPersistence={clearPersistence} />
    </SubscriptionWizardProvider>
  )
}

export function EventSubscription() {
  return (
    <EventSubscriptionProvider>
      <EventSubscriptionWizardShell />
    </EventSubscriptionProvider>
  )
}
