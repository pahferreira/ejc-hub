export const AppErrorCode = {
  Default: 'app_error',
  UserAlreadySubscribed: 'user_already_subscribed',
} as const

type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode]

export class AppError extends Error {
  #message: string
  #code: AppErrorCode

  constructor(message: string, code?: AppErrorCode) {
    super(message)
    this.#message = message
    this.#code = code || AppErrorCode.Default
  }

  getMessage() {
    return this.#message
  }

  getAppErrorCode() {
    return this.#code
  }
}
