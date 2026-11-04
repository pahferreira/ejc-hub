import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateScheduleActivityMutation } from '../../services/schedule/useCreateScheduleActivityMutation'
import { CreateActivityError } from '../../services/schedule/schedule.api'
import {
  buildActivityBody,
  DEFAULT_ACTIVITY_DURATION,
  DEFAULT_ACTIVITY_START,
  type ScheduleActivityFormValues,
} from '../../utils/scheduleActivity/scheduleActivity'
import type { ScheduleActivityFieldErrors } from './ScheduleActivityForm'

const TIME_PATTERN = /^\d{1,2}:\d{2}$/

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

/** The shape-level errors the form can catch before it reaches the API. */
function validate(values: ScheduleActivityFormValues): ScheduleActivityFieldErrors {
  const errors: ScheduleActivityFieldErrors = {}

  if (values.title.trim() === '') {
    errors.title = 'Informe um título'
  }
  if (!TIME_PATTERN.test(values.startTime)) {
    errors.startTime = 'Informe um horário'
  }
  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes <= 0) {
    errors.durationMinutes = 'Informe uma duração'
  }
  if (values.place.trim() === '') {
    errors.place = 'Informe o local'
  }

  return errors
}

/**
 * The inline "NOVA ATIVIDADE" form: open state, its values, the shape checks it
 * runs before submitting, and the create. `day` is the day the activity lands
 * on; `open` seeds the start (the suggested next start, or 08:00).
 *
 * The field errors stay hidden until the first submit. API validation errors
 * (overlap, nobody responsible…) come back from the mutation and render inline.
 */
export function useScheduleActivityForm(day: { id: string; date: string } | null) {
  const createMutation = useCreateScheduleActivityMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [values, setValues] = useState<ScheduleActivityFormValues>(
    initialValues(DEFAULT_ACTIVITY_START)
  )
  const [showErrors, setShowErrors] = useState(false)
  const [apiError, setApiError] = useState<string>()

  const open = (startTime: string = DEFAULT_ACTIVITY_START) => {
    setValues(initialValues(startTime))
    setShowErrors(false)
    setApiError(undefined)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const change = (patch: Partial<ScheduleActivityFormValues>) => {
    setApiError(undefined)
    setValues((current) => ({ ...current, ...patch }))
  }

  const fieldErrors = showErrors ? validate(values) : undefined

  const submit = () => {
    if (!day) {
      return
    }

    const errors = validate(values)
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }

    setApiError(undefined)

    createMutation
      .mutateAsync(buildActivityBody(day.id, day.date, values))
      .then(() => {
        setIsOpen(false)
        toast.success('Atividade adicionada!', { position: 'top-center' })
      })
      .catch((error: unknown) => {
        setApiError(
          error instanceof CreateActivityError || error instanceof Error
            ? error.message
            : 'Não foi possível adicionar a atividade.'
        )
      })
  }

  return {
    isOpen,
    open,
    close,
    values,
    change,
    fieldErrors,
    error: apiError,
    submit,
    isSubmitting: createMutation.isPending,
  }
}
