import { createContext } from 'react'
import type { StepId } from './subscriptionWizardConfig'

export type SubscriptionWizardContextValue = {
  currentStep: StepId
  stepIndex: number
  totalSteps: number
  isFirst: boolean
  isLast: boolean
  maxReachedStep: number
  isNavigating: boolean
  goNext: () => Promise<void>
  goPrev: () => void
  goTo: (step: StepId) => void
}

export const SubscriptionWizardContext = createContext<SubscriptionWizardContextValue | null>(null)
