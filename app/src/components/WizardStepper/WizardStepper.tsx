import clsx from 'clsx'

type WizardStepperProps<Id extends string> = {
  steps: { id: Id; label: string }[]
  currentStep: Id
  maxReachedStepIndex: number
  onStepClick: (step: Id) => void
}

export function WizardStepper<Id extends string>(props: WizardStepperProps<Id>) {
  const currentIndex = props.steps.findIndex((s) => s.id === props.currentStep)

  return (
    <nav className="flex items-stretch w-full gap-3 mb-8">
      {props.steps.map((step, index) => {
        const isActive = step.id === props.currentStep
        const isCompleted = index < currentIndex
        const isReached = isActive || isCompleted
        const isClickable = index <= props.maxReachedStepIndex

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isClickable && props.onStepClick(step.id)}
            className={clsx(
              'flex flex-col gap-2 flex-1 text-left',
              isClickable ? 'cursor-pointer' : 'pointer-events-none'
            )}
          >
            <div
              className={clsx(
                'h-1 w-full rounded-full transition-colors',
                isReached ? 'bg-primary' : 'bg-secondary/30'
              )}
            />
            <span
              className={clsx('text-sm font-medium', isReached ? 'text-gray-900' : 'text-gray-500')}
            >
              {step.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
