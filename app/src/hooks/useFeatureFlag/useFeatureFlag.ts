import { useActiveFeatureFlags, usePostHog } from '@posthog/react'
import { useCallback } from 'react'

const isPostHogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST
)

export function useFeatureFlag() {
  const posthog = usePostHog()
  // Subscribes the consumer to flag loads/refreshes so it re-renders and
  // re-evaluates the flags it reads below.
  useActiveFeatureFlags()

  const isFeatureEnabled = useCallback(
    (flag: string, defaultValue = false) => {
      if (!isPostHogConfigured) {
        return defaultValue
      }

      return posthog.isFeatureEnabled(flag) ?? defaultValue
    },
    [posthog]
  )

  return { isFeatureEnabled }
}
