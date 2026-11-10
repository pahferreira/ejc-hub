import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateScheduleActivityMutation } from '../../services/schedule/useCreateScheduleActivityMutation'
import { useUpdateScheduleActivityMutation } from '../../services/schedule/useUpdateScheduleActivityMutation'
import { useDeleteScheduleActivityMutation } from '../../services/schedule/useDeleteScheduleActivityMutation'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityFormValues,
  buildActivityBody,
  DEFAULT_ACTIVITY_DURATION,
  DEFAULT_ACTIVITY_START,
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

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/**
 * The inline activity form: open state, where it sits, its values, the shape
 * checks it runs before submitting (`scheduleActivityFormSchema`), and the
 * create, edit and delete. `day` is the day the activity lands on.
 *
 * `open` starts a new activity (the suggested next start, or a gap's start and
 * length); `edit` pre-fills every field from an activity. Excluir asks for
 * confirmation first (`askDelete`), then `confirmDelete` deletes.
 *
 * The field errors stay hidden until the first submit, then follow every
 * change. API validation errors (overlap…) come back from the mutation and
 * render inline.
 */
export function useScheduleActivityForm(day: { id: string; date: string } | null) {
  const createMutation = useCreateScheduleActivityMutation()
  const updateMutation = useUpdateScheduleActivityMutation()
  const deleteMutation = useDeleteScheduleActivityMutation()

  const form = useForm<ScheduleActivityFormValues>({
    resolver: zodResolver(scheduleActivityFormSchema),
    defaultValues: initialValues(DEFAULT_ACTIVITY_START, DEFAULT_ACTIVITY_DURATION),
  })
  const [placement, setPlacement] = useState<ScheduleActivityFormPlacement | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const show = (next: ScheduleActivityFormPlacement, values: ScheduleActivityFormValues) => {
    form.reset(values)
    setApiError(undefined)
    setPlacement(next)
  }

  /** A new activity: at the end of the day, or filling the gap after `afterActivityId`. */
  const open = (
    startTime: string = DEFAULT_ACTIVITY_START,
    durationMinutes: number = DEFAULT_ACTIVITY_DURATION,
    afterActivityId?: string
  ) => {
    show(
      afterActivityId ? { kind: 'gap', afterActivityId } : { kind: 'end' },
      initialValues(startTime, durationMinutes)
    )
  }

  const edit = (activity: ScheduleActivity) => {
    show({ kind: 'edit', activityId: activity.id }, activityFormValues(activity))
  }

  const close = () => {
    setPlacement(null)
    setIsConfirmingDelete(false)
  }

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
      if (placement.kind === 'edit') {
        await updateMutation.mutateAsync({ activityId: placement.activityId, body })
        toast.success('Atividade atualizada!', { position: 'top-center' })
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Atividade adicionada!', { position: 'top-center' })
      }
      setPlacement(null)
    } catch (error) {
      setApiError(errorMessage(error, 'Não foi possível salvar a atividade.'))
    }
  }

  const submit = () => {
    if (!day) {
      return
    }

    void form.handleSubmit(save)()
  }

  const askDelete = () => setIsConfirmingDelete(true)

  const cancelDelete = () => setIsConfirmingDelete(false)

  const confirmDelete = async () => {
    if (placement?.kind !== 'edit') {
      return
    }

    try {
      await deleteMutation.mutateAsync(placement.activityId)
      close()
      toast.success('Atividade excluída!', { position: 'top-center' })
    } catch (error) {
      setIsConfirmingDelete(false)
      setApiError(errorMessage(error, 'Não foi possível excluir a atividade.'))
    }
  }

  return {
    isOpen: placement !== null,
    placement,
    open,
    edit,
    close,
    values: form.watch(),
    change,
    fieldErrors,
    error: apiError,
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isConfirmingDelete,
    askDelete,
    cancelDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  }
}
