import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import type { ScheduleViewerRole } from '../../services/schedule/schedule.types'

const SCHEDULE_VIEWED_EVENT = 'schedule_viewed'

/**
 * Reports `schedule_viewed` whenever a day's tab is shown: on opening and on
 * every switch. Nothing is reported until both are known, which is once the
 * schedule has loaded with at least one day.
 */
export function useScheduleViewedTracking(
  date: string | undefined,
  role: ScheduleViewerRole | undefined
) {
  const posthog = usePostHog()

  useEffect(() => {
    if (date && role) {
      posthog.capture(SCHEDULE_VIEWED_EVENT, { day: date, role })
    }
  }, [posthog, date, role])
}
