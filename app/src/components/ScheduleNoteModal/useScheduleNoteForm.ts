import { useState } from 'react'
import { SCHEDULE_NOTE_MAX_LENGTH } from '../../../../common/schedule/schedule.constants'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { useCreateScheduleNoteMutation } from '../../services/schedule/useCreateScheduleNoteMutation'
import { toastPromise } from '../../utils/toast/toast'

type NotedActivity = Pick<ScheduleActivity, 'id' | 'title'>

/** What's wrong with a note body, or undefined when it can be saved. */
export function noteBodyError(body: string): string | undefined {
  const length = body.trim().length

  if (length === 0) {
    return 'Escreva a nota'
  }

  if (length > SCHEDULE_NOTE_MAX_LENGTH) {
    return `A nota pode ter até ${SCHEDULE_NOTE_MAX_LENGTH} caracteres`
  }

  return undefined
}

/**
 * The "Nova nota" modal on the Cronograma: which activity it is for, the body,
 * and the save. The error stays hidden until the first submit, so the modal
 * doesn't open on red.
 */
export function useScheduleNoteForm() {
  const createMutation = useCreateScheduleNoteMutation()

  const [activity, setActivity] = useState<NotedActivity | null>(null)
  const [body, setBody] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const open = (target: NotedActivity) => {
    setActivity({ id: target.id, title: target.title })
    setBody('')
    setShowErrors(false)
  }

  const close = () => setActivity(null)

  const error = noteBodyError(body)

  const submit = () => {
    if (!activity) {
      return
    }

    if (error) {
      setShowErrors(true)
      return
    }

    const pending = createMutation
      .mutateAsync({ activityId: activity.id, body: { body: body.trim() } })
      .then(() => setActivity(null))

    toastPromise(pending, { message: 'Nota salva!' })
  }

  return {
    isOpen: activity !== null,
    activityTitle: activity?.title ?? '',
    open,
    close,
    body,
    setBody,
    error: showErrors ? error : undefined,
    submit,
    isSubmitting: createMutation.isPending,
  }
}
