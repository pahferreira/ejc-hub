import type { AppError } from '../AppError.ts'

/** The `AppErrorCode` a rejected call carries, so a spec can pin the status it answers. */
export async function rejectionCode(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return (error as AppError).getAppErrorCode()
  }
  throw new Error('Expected the call to reject')
}
