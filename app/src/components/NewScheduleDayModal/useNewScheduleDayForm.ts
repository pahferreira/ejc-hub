import { useState } from 'react'
import { useCreateScheduleDayMutation } from '../../services/schedule/useCreateScheduleDayMutation'
import { useUpdateScheduleDayMutation } from '../../services/schedule/useUpdateScheduleDayMutation'
import { toastPromise } from '../../utils/toast/toast'
import type { ScheduleDay } from '../../services/schedule/schedule.types'

type EditedDay = Pick<ScheduleDay, 'id' | 'date'>

/**
 * The "Novo dia do cronograma" modal: open state, the date, and the create or,
 * opened through `openToEdit`, the move of an existing day to another date.
 *
 * The date is the one field. A chip fills it; the date input is for typing it.
 * The error stays hidden until the first submit, so the modal doesn't open on red.
 * `onSaved` hands back the day's id so the page can select its tab.
 */
export function useNewScheduleDayForm(onSaved: (dayId: string) => void) {
  const createMutation = useCreateScheduleDayMutation()
  const updateMutation = useUpdateScheduleDayMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  // The day being moved, or null when adding a new one.
  const [editingDay, setEditingDay] = useState<EditedDay | null>(null)

  const open = () => {
    setEditingDay(null)
    setDate('')
    setShowErrors(false)
    setIsOpen(true)
  }

  const openToEdit = (day: EditedDay) => {
    setEditingDay({ id: day.id, date: day.date })
    setDate(day.date)
    setShowErrors(false)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const submit = () => {
    if (!date) {
      setShowErrors(true)
      return
    }

    const saving = editingDay
      ? updateMutation.mutateAsync({ dayId: editingDay.id, body: { date } })
      : createMutation.mutateAsync({ date })

    const pending = saving.then((result) => {
      setIsOpen(false)
      onSaved(result.dayId)
    })

    toastPromise(pending, {
      message: editingDay ? 'Data do dia alterada com sucesso!' : 'Dia criado com sucesso!',
    })
  }

  return {
    isOpen,
    open,
    openToEdit,
    close,
    mode: editingDay ? ('edit' as const) : ('create' as const),
    /** The date of the day being moved, which stays among its chips. */
    editingDate: editingDay?.date ?? null,
    date,
    setDate,
    error: showErrors && !date ? 'Escolha a data do dia' : undefined,
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  }
}
