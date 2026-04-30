import { useContext } from 'react'
import { SubscriptionWizardContext } from './SubscriptionWizardContext'

export function useSubscriptionWizard() {
  const context = useContext(SubscriptionWizardContext)
  if (!context) {
    throw new Error('useSubscriptionWizard must be used within SubscriptionWizardProvider')
  }
  return context
}
