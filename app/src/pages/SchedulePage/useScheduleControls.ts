import { useQueryClient } from '@tanstack/react-query'
import type {
  ScheduleActivity,
  ScheduleActivityStatus,
} from '../../services/schedule/schedule.types'
import { scheduleMutationKeys } from '../../services/schedule/schedule.types'
import { useFinishScheduleActivityMutation } from '../../services/schedule/useFinishScheduleActivityMutation'
import { useSkipScheduleActivityMutation } from '../../services/schedule/useSkipScheduleActivityMutation'
import { useStartScheduleActivityMutation } from '../../services/schedule/useStartScheduleActivityMutation'
import { useUndoScheduleActivityMutation } from '../../services/schedule/useUndoScheduleActivityMutation'
import type { ToastAction } from '../../utils/toast/toast'
import { toastPromise } from '../../utils/toast/toast'

type ControlledActivity = Pick<ScheduleActivity, 'id' | 'status'>

/** How long a toast offers "Desfazer" after a start, finish or skip. */
const UNDO_TOAST_DURATION = 8000

/** What the toast says once an undo lands, by the status it undid. */
const UNDONE_MESSAGES: Record<ScheduleActivityStatus, string> = {
  planned: 'Desfeito!',
  running: 'Início desfeito!',
  done: 'Atividade reaberta!',
  skipped: 'Atividade de volta ao cronograma!',
}

/**
 * The toast's "Desfazer". Like the buttons, it does nothing while a clock
 * control is in flight; the toast then stays open so it can be tapped again.
 * `isControlPending` is read at click time, since the toast outlives renders.
 */
export function undoToastAction(undo: () => void, isControlPending: () => boolean): ToastAction {
  return {
    label: 'Desfazer',
    onClick: (event) => {
      if (isControlPending()) {
        event.preventDefault()
        return
      }

      undo()
    },
  }
}

/**
 * The admin's clock controls on the Cronograma. Each sends the status the
 * screen shows; the outcome shows as a toast, and a 409 reads "O cronograma
 * mudou" while the mutation refetches. A start, finish or skip toast offers
 * "Desfazer" for about 8 s, which sends the same undo as the buttons and, like
 * them, waits out any control in flight.
 */
export function useScheduleControls() {
  const queryClient = useQueryClient()
  const startMutation = useStartScheduleActivityMutation()
  const finishMutation = useFinishScheduleActivityMutation()
  const skipMutation = useSkipScheduleActivityMutation()
  const undoMutation = useUndoScheduleActivityMutation()

  const undo = (activity: ControlledActivity) => {
    const pending = undoMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, { message: UNDONE_MESSAGES[activity.status] })
  }

  // The success toast of an action that left the activity in `status`.
  const undoable = (activityId: string, status: ScheduleActivityStatus, message: string) => ({
    message,
    action: undoToastAction(
      () => undo({ id: activityId, status }),
      () => queryClient.isMutating({ mutationKey: scheduleMutationKeys.control }) > 0
    ),
    duration: UNDO_TOAST_DURATION,
  })

  const start = (activity: ControlledActivity) => {
    const pending = startMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, undoable(activity.id, 'running', 'Atividade iniciada!'))
  }

  const finish = (activity: ControlledActivity) => {
    const pending = finishMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, undoable(activity.id, 'done', 'Atividade concluída!'))
  }

  const skip = (activity: ControlledActivity) => {
    const pending = skipMutation.mutateAsync({
      activityId: activity.id,
      body: { expectedStatus: activity.status },
    })

    toastPromise(pending, undoable(activity.id, 'skipped', 'Atividade pulada!'))
  }

  return {
    start,
    finish,
    skip,
    undo,
    isPending:
      startMutation.isPending ||
      finishMutation.isPending ||
      skipMutation.isPending ||
      undoMutation.isPending,
  }
}
