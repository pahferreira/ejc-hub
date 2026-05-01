import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { EventSubscriptionFormInput } from '../useEventSubscriptionForm/eventSubscription.schema'
import type { StepId } from '../useSubscriptionWizard/subscriptionWizardConfig'
import { STEPS } from '../useSubscriptionWizard/subscriptionWizardConfig'

const STORAGE_KEY = 'ejc-subscription-form-v2'
const VERSION = 'v2'

type PersistedData = {
  version: string
  values: EventSubscriptionFormInput
  currentStep: StepId
}

type UseSubscriptionFormPersistenceReturn = {
  initialStep: StepId | null
  clearPersistence: () => void
}

function loadPersistedData(
  form: UseFormReturn<EventSubscriptionFormInput>,
  currentStepRef: React.MutableRefObject<StepId>
): StepId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: PersistedData = JSON.parse(raw)
    if (parsed.version !== VERSION) return null
    form.reset(parsed.values)
    const step = parsed.currentStep
    if (STEPS.includes(step)) {
      currentStepRef.current = step
      return step
    }
    return null
  } catch {
    return null
  }
}

export function useSubscriptionFormPersistence(
  form: UseFormReturn<EventSubscriptionFormInput>
): UseSubscriptionFormPersistenceReturn {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentStepRef = useRef<StepId>('personal')
  const initializedRef = useRef(false)
  const initialStepRef = useRef<StepId | null>(null)

  if (!initializedRef.current) {
    initializedRef.current = true
    initialStepRef.current = loadPersistedData(form, currentStepRef)
  }

  const clearPersistence = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    const persist = (currentStep: StepId) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const values = form.getValues()
        const data: PersistedData = { version: VERSION, values, currentStep }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }, 500)
    }

    const subscription = form.watch(() => {
      persist(currentStepRef.current)
    })
    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form])

  return {
    initialStep: initialStepRef.current,
    clearPersistence,
  }
}

export function updatePersistedStep(step: StepId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: PersistedData = JSON.parse(raw)
    if (parsed.version !== VERSION) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, currentStep: step }))
  } catch {
    // ignore
  }
}
