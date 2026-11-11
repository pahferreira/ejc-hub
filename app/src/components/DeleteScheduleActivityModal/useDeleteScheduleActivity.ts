import { useState } from 'react'
import { useDeleteScheduleActivityMutation } from '../../services/schedule/useDeleteScheduleActivityMutation'
import { toastPromise } from '../../utils/toast/toast'

/**
 * Deleting an activity from its edit form: Excluir asks for confirmation first
 * (`ask`), then `confirm` deletes. The outcome shows as a toast; on success the
 * modal closes and `onDeleted` runs (the page closes the edit form), on failure
 * the modal stays open to try again.
 */
export function useDeleteScheduleActivity(onDeleted: () => void) {
  const deleteMutation = useDeleteScheduleActivityMutation()
  const [isConfirming, setIsConfirming] = useState(false)

  const ask = () => setIsConfirming(true)

  const cancel = () => setIsConfirming(false)

  const confirm = (activityId: string) => {
    const pending = deleteMutation.mutateAsync(activityId).then(() => {
      setIsConfirming(false)
      onDeleted()
    })

    toastPromise(pending, { message: 'Atividade excluída!' })
  }

  return {
    isConfirming,
    ask,
    cancel,
    confirm,
    isDeleting: deleteMutation.isPending,
  }
}
