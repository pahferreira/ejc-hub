import { useState } from 'react'
import { toast } from 'sonner'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { useUpdateScheduleActivityLiveMutation } from '../../services/schedule/useUpdateScheduleActivityLiveMutation'
import {
  buildLiveEditBody,
  liveEditFields,
  liveEditFormValues,
  validateLiveEdit,
  type LiveEditFieldErrors,
  type LiveEditFormValues,
} from '../../utils/scheduleLiveEdit/scheduleLiveEdit'

const EMPTY_VALUES: LiveEditFormValues = { adjustedDuration: '', startTime: '', endTime: '' }

/**
 * The Cronograma's live-edit form ("✎"): the activity it edits, its values,
 * the shape checks it runs (`validateLiveEdit`) and the save. One activity at
 * a time; opening another replaces it.
 *
 * The field errors stay hidden until the first submit, then follow every
 * change. API errors (overlap, "O cronograma mudou") render on the form. A
 * save that changes nothing just closes it.
 */
export function useScheduleLiveEditForm() {
  const mutation = useUpdateScheduleActivityLiveMutation()
  const [activity, setActivity] = useState<ScheduleActivity | null>(null)
  const [values, setValues] = useState<LiveEditFormValues>(EMPTY_VALUES)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const fields = liveEditFields(activity?.status ?? 'skipped')
  const fieldErrors: LiveEditFieldErrors = isSubmitted ? validateLiveEdit(values, fields) : {}

  const open = (next: ScheduleActivity) => {
    setActivity(next)
    setValues(liveEditFormValues(next))
    setIsSubmitted(false)
    setApiError(undefined)
  }

  const close = () => setActivity(null)

  const change = (patch: Partial<LiveEditFormValues>) => {
    setApiError(undefined)
    setValues((current) => ({ ...current, ...patch }))
  }

  const save = async (edited: ScheduleActivity) => {
    const body = buildLiveEditBody(edited, values)

    if (!body) {
      setActivity(null)
      return
    }

    try {
      await mutation.mutateAsync({ activityId: edited.id, body })
      toast.success('Ajuste salvo!', { position: 'top-center' })
      setActivity(null)
    } catch (error) {
      // The API layer throws an `Error` carrying the pt-BR message.
      setApiError((error as Error).message)
    }
  }

  const submit = () => {
    if (!activity) {
      return
    }

    setIsSubmitted(true)

    if (Object.keys(validateLiveEdit(values, fields)).length > 0) {
      return
    }

    void save(activity)
  }

  return {
    editingActivityId: activity?.id ?? null,
    fields,
    open,
    close,
    values,
    change,
    fieldErrors,
    error: apiError,
    submit,
    isSubmitting: mutation.isPending,
  }
}
