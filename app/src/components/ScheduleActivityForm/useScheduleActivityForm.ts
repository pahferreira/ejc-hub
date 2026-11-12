import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateScheduleActivityMutation } from '../../services/schedule/useCreateScheduleActivityMutation'
import { useUpdateScheduleActivityMutation } from '../../services/schedule/useUpdateScheduleActivityMutation'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityFormValues,
  buildActivityBody,
  DEFAULT_ACTIVITY_DURATION,
  DEFAULT_ACTIVITY_START,
  type ActivityGap,
} from '../../utils/scheduleActivity/scheduleActivity'
import {
  scheduleActivityFormSchema,
  type ScheduleActivityFormValues,
} from '../../utils/scheduleActivity/scheduleActivityForm.schema'
import type { ScheduleActivityFieldErrors } from './ScheduleActivityForm'

/** The form's values when it first opens: everything empty, the given start and duration. */
function initialValues(startTime: string, durationMinutes: number): ScheduleActivityFormValues {
  return {
    title: '',
    startTime,
    durationMinutes,
    place: '',
    teamInstanceIds: [],
    guestName: '',
    adminsResponsible: false,
    allTeams: false,
  }
}

/**
 * Where the open form sits in the day's list: at the end (a new activity), in
 * a gap (a new activity filling it, right under the activity it follows), or
 * in place of the card it edits.
 */
export type ScheduleActivityFormPlacement =
  | { kind: 'end' }
  | { kind: 'gap'; afterActivityId: string }
  | { kind: 'edit'; activityId: string }

/**
 * The inline activity form: open state, where it sits, its values, the shape
 * checks it runs before submitting (`scheduleActivityFormSchema`), and the
 * create and edit. `day` is the day the activity lands on.
 *
 * `open` starts a new activity at the end of the day, `fillGap` one filling a
 * gap (its start and length), and `edit` pre-fills every field from an
 * activity. `editingActivityId` names the activity being edited, if any.
 *
 * The field errors stay hidden until the first submit, then follow every
 * change. API validation errors (overlap…) come back from the mutation and
 * render inline.
 */
export function useScheduleActivityForm(day: { id: string; date: string } | null) {
  const createMutation = useCreateScheduleActivityMutation()
  const updateMutation = useUpdateScheduleActivityMutation()

  const form = useForm<ScheduleActivityFormValues>({
    resolver: zodResolver(scheduleActivityFormSchema),
    defaultValues: initialValues(DEFAULT_ACTIVITY_START, DEFAULT_ACTIVITY_DURATION),
  })
  const [placement, setPlacement] = useState<ScheduleActivityFormPlacement | null>(null)
  const [apiError, setApiError] = useState<string>()
  const editingActivityId = placement?.kind === 'edit' ? placement.activityId : undefined

  const show = (next: ScheduleActivityFormPlacement, values: ScheduleActivityFormValues) => {
    form.reset(values)
    setApiError(undefined)
    setPlacement(next)
  }

  /** A new activity at the end of the day. */
  const open = (startTime: string = DEFAULT_ACTIVITY_START) => {
    show({ kind: 'end' }, initialValues(startTime, DEFAULT_ACTIVITY_DURATION))
  }

  /** A new activity filling a gap: its start and length, right under the activity it follows. */
  const fillGap = (gap: ActivityGap) => {
    show(
      { kind: 'gap', afterActivityId: gap.afterActivityId },
      initialValues(gap.startTime, gap.durationMinutes)
    )
  }

  const edit = (activity: ScheduleActivity) => {
    show({ kind: 'edit', activityId: activity.id }, activityFormValues(activity))
  }

  const close = () => setPlacement(null)

  const change = (patch: Partial<ScheduleActivityFormValues>) => {
    setApiError(undefined)
    for (const name of Object.keys(patch) as (keyof ScheduleActivityFormValues)[]) {
      form.setValue(name, patch[name] as ScheduleActivityFormValues[typeof name])
    }
    // Inputs stay unregistered (the form is controlled), so after the first
    // submit each change re-validates by hand. The whole form, not just the
    // changed field: the responsible error sits on `teamInstanceIds` but a
    // guest or the admins toggle clears it too.
    if (form.formState.isSubmitted) {
      void form.trigger()
    }
  }

  const { errors } = form.formState
  const fieldErrors: ScheduleActivityFieldErrors = {
    title: errors.title?.message,
    startTime: errors.startTime?.message,
    durationMinutes: errors.durationMinutes?.message,
    place: errors.place?.message,
    responsible: errors.teamInstanceIds?.message,
  }

  const save = async (values: ScheduleActivityFormValues) => {
    if (!day || !placement) {
      return
    }

    setApiError(undefined)
    const body = buildActivityBody(day.id, day.date, values)

    try {
      if (editingActivityId) {
        await updateMutation.mutateAsync({ activityId: editingActivityId, body })
        toast.success('Atividade atualizada!', { position: 'top-center' })
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Atividade adicionada!', { position: 'top-center' })
      }
      setPlacement(null)
    } catch (error) {
      // The API layer always throws a `ScheduleActivityError` carrying the pt-BR message.
      setApiError((error as Error).message)
    }
  }

  const submit = () => {
    if (!day) {
      return
    }

    void form.handleSubmit(save)()
  }

  return {
    isOpen: placement !== null,
    placement,
    editingActivityId,
    open,
    fillGap,
    edit,
    close,
    values: form.watch(),
    change,
    fieldErrors,
    error: apiError,
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  }
}
