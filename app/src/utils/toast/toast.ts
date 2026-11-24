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
  /** A button on the success toast, such as "Desfazer". */
  action?: { label: string; onClick: () => void }
  /** How long the success toast stays, in ms, when not the default. */
  duration?: number
}

export function toastPromise(pendingPromise: Promise<unknown>, success?: Success) {
  toast.promise(pendingPromise, {
    position: toastConfig.position,
    loading: 'Aguarde...',
    success: () => {
      success?.callback?.()
      return {
        message: success?.message || 'Sucesso!',
        action: success?.action,
        duration: success?.duration ?? TOAST_DURATION,
      }
    },
    error: (error) => error.message,
  })
}
