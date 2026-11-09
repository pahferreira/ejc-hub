import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateScheduleActivityMutation } from '../../services/schedule/useCreateScheduleActivityMutation'
import { CreateActivityError } from '../../services/schedule/schedule.api'
import {
  buildActivityBody,
  DEFAULT_ACTIVITY_DURATION,
  DEFAULT_ACTIVITY_START,
} from '../../utils/scheduleActivity/scheduleActivity'
import {
  scheduleActivityFormSchema,
  type ScheduleActivityFormValues,
} from '../../utils/scheduleActivity/scheduleActivityForm.schema'
import type { ScheduleActivityFieldErrors } from './ScheduleActivityForm'

/** The form's values when it first opens: everything empty, the given start. */
function initialValues(startTime: string): ScheduleActivityFormValues {
  return {
    title: '',
    startTime,
    durationMinutes: DEFAULT_ACTIVITY_DURATION,
    place: '',
    teamInstanceIds: [],
    guestName: '',
    adminsResponsible: false,
  }
}

/**
 * The inline "NOVA ATIVIDADE" form: open state, its values, the shape checks it
 * runs before submitting (`scheduleActivityFormSchema`), and the create. `day`
 * is the day the activity lands on; `open` seeds the start (the suggested next
 * start, or 06:00).
 *
 * The field errors stay hidden until the first submit, then follow every
 * change. API validation errors (overlap…) come back from
 * the mutation and render inline.
 */
export function useScheduleActivityForm(day: { id: string; date: string } | null) {
  const createMutation = useCreateScheduleActivityMutation()

  const form = useForm<ScheduleActivityFormValues>({
    resolver: zodResolver(scheduleActivityFormSchema),
    defaultValues: initialValues(DEFAULT_ACTIVITY_START),
  })
  const [isOpen, setIsOpen] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const open = (startTime: string = DEFAULT_ACTIVITY_START) => {
    form.reset(initialValues(startTime))
    setApiError(undefined)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

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

  const create = async (values: ScheduleActivityFormValues) => {
    if (!day) {
      return
    }

    setApiError(undefined)

    try {
      await createMutation.mutateAsync(buildActivityBody(day.id, day.date, values))
      setIsOpen(false)
      toast.success('Atividade adicionada!', { position: 'top-center' })
    } catch (error) {
      setApiError(
        error instanceof CreateActivityError || error instanceof Error
          ? error.message
          : 'Não foi possível adicionar a atividade.'
      )
    }
  }

  const submit = () => {
    if (!day) {
      return
    }

    void form.handleSubmit(create)()
  }

  return {
    isOpen,
    open,
    close,
    values: form.watch(),
    change,
    fieldErrors,
    error: apiError,
    submit,
    isSubmitting: createMutation.isPending,
  }
}
