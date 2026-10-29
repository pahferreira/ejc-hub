import { useState } from 'react'
import { useCreateScheduleDayMutation } from '../../services/schedule/useCreateScheduleDayMutation'
import { toastPromise } from '../../utils/toast/toast'

/**
 * The "Novo dia do cronograma" modal: open state, the date, and the create.
 *
 * The date is the one field. A chip fills it; the date input is for typing it.
 * The error stays hidden until the first submit, so the modal doesn't open on red.
 * `onCreated` hands back the new day's id so the page can select its tab.
 */
export function useNewScheduleDayForm(onCreated: (dayId: string) => void) {
  const createMutation = useCreateScheduleDayMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const open = () => {
    setDate('')
    setShowErrors(false)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  const submit = () => {
    if (!date) {
      setShowErrors(true)
      return
    }

    const pending = createMutation.mutateAsync({ date }).then((result) => {
      setIsOpen(false)
      onCreated(result.dayId)
    })

    toastPromise(pending, { message: 'Dia criado com sucesso!' })
  }

  return {
    isOpen,
    open,
    close,
    date,
    setDate,
    error: showErrors && !date ? 'Escolha a data do dia' : undefined,
    submit,
    isCreating: createMutation.isPending,
  }
}
