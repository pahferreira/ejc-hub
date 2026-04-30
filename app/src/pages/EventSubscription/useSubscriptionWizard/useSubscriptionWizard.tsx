import { useState } from 'react'
import type { ReactNode } from 'react'
import { useEventSubscriptionForm } from '../useEventSubscriptionForm/useEventSubscriptionForm'
import { STEPS, STEP_FIELDS } from './subscriptionWizardConfig'
import type { StepId } from './subscriptionWizardConfig'
import { SubscriptionWizardContext } from './SubscriptionWizardContext'

type SubscriptionWizardProviderProps = {
  children: ReactNode
  initialStep?: StepId
  onStepChange?: (step: StepId) => void
}

export function SubscriptionWizardProvider(props: SubscriptionWizardProviderProps) {
  const form = useEventSubscriptionForm()
  const initialIndex = props.initialStep ? STEPS.indexOf(props.initialStep) : 0
  const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0
  const [stepIndex, setStepIndex] = useState(safeInitialIndex)
  const [maxReachedStep, setMaxReachedStep] = useState(safeInitialIndex)
  const [isNavigating, setIsNavigating] = useState(false)

  const currentStep = STEPS[stepIndex]
  const totalSteps = STEPS.length
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1

  const goNext = async () => {
    setIsNavigating(true)
    try {
      const fields = STEP_FIELDS[currentStep]
      const isValid = await form.trigger(fields)
      if (!isValid) return
      const nextIndex = stepIndex + 1
      setStepIndex(nextIndex)
      if (nextIndex > maxReachedStep) {
        setMaxReachedStep(nextIndex)
      }
      props.onStepChange?.(STEPS[nextIndex])
    } finally {
      setIsNavigating(false)
    }
  }

  const goPrev = () => {
    if (isFirst) return
    const prevIndex = stepIndex - 1
    setStepIndex(prevIndex)
    props.onStepChange?.(STEPS[prevIndex])
  }

  const goTo = (step: StepId) => {
    const targetIndex = STEPS.indexOf(step)
    if (targetIndex <= maxReachedStep) {
      setStepIndex(targetIndex)
      props.onStepChange?.(step)
    }
  }

  return (
    <SubscriptionWizardContext.Provider
      value={{
        currentStep,
        stepIndex,
        totalSteps,
        isFirst,
        isLast,
        maxReachedStep,
        isNavigating,
        goNext,
        goPrev,
        goTo,
      }}
    >
      {props.children}
    </SubscriptionWizardContext.Provider>
  )
}
