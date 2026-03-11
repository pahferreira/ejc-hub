import { toast } from 'sonner'
import type { ToasterProps } from 'sonner'

const TOAST_DURATION = 5000
const toastConfig: ToasterProps = {
  duration: TOAST_DURATION,
  position: 'top-center',
}

type Success = {
  message: string
  callback?: () => void
}

export function toastPromise(pendingPromise: Promise<unknown>, success?: Success) {
  toast.promise(pendingPromise, {
    position: toastConfig.position,
    loading: 'Aguarde...',
    success: () => {
      success?.callback?.()
      return success?.message || 'Sucesso!'
    },
    error: (error) => error.message,
  })
}
