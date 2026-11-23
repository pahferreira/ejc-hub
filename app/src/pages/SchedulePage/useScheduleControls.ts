import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { useFinishScheduleActivityMutation } from '../../services/schedule/useFinishScheduleActivityMutation'
import { useStartScheduleActivityMutation } from '../../services/schedule/useStartScheduleActivityMutation'
import { toastPromise } from '../../utils/toast/toast'

/**
 * The admin's clock controls on the Cronograma. Each sends the status the
 * screen shows; the outcome shows as a toast, and a 409 reads "O cronograma
 * mudou" while the mutation refetches.
 */
export function useScheduleControls() {
  const startMutation = useStartScheduleActivityMutation()
  const finishMutation = useFinishScheduleActivityMutation()

  const start = (activity: Pick<ScheduleActivity, 'id' | 'status'>) => {
    const pending = startMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, { message: 'Atividade iniciada!' })
  }

  const finish = (activity: Pick<ScheduleActivity, 'id' | 'status'>) => {
    const pending = finishMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, { message: 'Atividade concluída!' })
  }

  return {
    start,
    finish,
    isPending: startMutation.isPending || finishMutation.isPending,
  }
}
