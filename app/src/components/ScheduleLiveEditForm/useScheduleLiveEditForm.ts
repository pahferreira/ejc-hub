import { useState } from 'react'
import { toast } from 'sonner'
import { isScheduleChangedError } from '../../services/schedule/schedule.api'
import type { ScheduleActivity, ScheduleDay } from '../../services/schedule/schedule.types'
import { useScheduleQuery } from '../../services/schedule/useScheduleQuery'
import { useUpdateScheduleActivityLiveMutation } from '../../services/schedule/useUpdateScheduleActivityLiveMutation'
import {
  buildLiveEditBody,
  canEditLive,
  liveEditFields,
  liveEditFormValues,
  validateLiveEdit,
  type LiveEditFieldErrors,
  type LiveEditFormValues,
} from '../../utils/scheduleLiveEdit/scheduleLiveEdit'

const EMPTY_VALUES: LiveEditFormValues = { adjustedDuration: '', startTime: '', endTime: '' }

const SCHEDULE_CHANGED = 'O cronograma mudou'

/** What the open form becomes once the schedule is refetched after a 409. */
export type LiveEditResync =
  | { kind: 'close' }
  | { kind: 'reopen'; activity: ScheduleActivity; values: LiveEditFormValues }

/**
 * After a 409, the form follows the refetched activity so a retry sends its
 * real status. It closes when the activity is gone or has nothing left to
 * correct (skipped). With the same status, the admin's values stay; with
 * another, the parts shown change, so the values start again from the activity.
 */
export function resyncLiveEdit(
  days: ScheduleDay[] | undefined,
  edited: Pick<ScheduleActivity, 'id' | 'status'>,
  values: LiveEditFormValues
): LiveEditResync {
  const fresh = days?.flatMap((day) => day.activities).find((activity) => activity.id === edited.id)

  if (!fresh || !canEditLive(fresh.status)) {
    return { kind: 'close' }
  }

  return {
    kind: 'reopen',
    activity: fresh,
    values: fresh.status === edited.status ? values : liveEditFormValues(fresh),
  }
}

/**
 * The Cronograma's live-edit form ("✎"): the activity it edits, its values,
 * the shape checks it runs (`validateLiveEdit`) and the save. One activity at
 * a time; opening another replaces it.
 *
 * The field errors stay hidden until the first submit, then follow every
 * change. API errors (overlap, future end…) render on the form. A 409 refetches
 * the schedule and follows the activity's real status (`resyncLiveEdit`),
 * saying "O cronograma mudou", so a retry doesn't fail again. A save that
 * changes nothing just closes it.
 */
export function useScheduleLiveEditForm() {
  const scheduleQuery = useScheduleQuery()
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

  const resync = async (edited: ScheduleActivity) => {
    const { data } = await scheduleQuery.refetch()
    const next = resyncLiveEdit(data?.days, edited, values)

    if (next.kind === 'close') {
      setActivity(null)
      toast.error(SCHEDULE_CHANGED, { position: 'top-center' })
      return
    }

    setActivity(next.activity)
    setValues(next.values)
    setIsSubmitted(false)
    setApiError(`${SCHEDULE_CHANGED}. Confira e salve de novo.`)
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
      if (isScheduleChangedError(error)) {
        await resync(edited)
        return
      }

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
