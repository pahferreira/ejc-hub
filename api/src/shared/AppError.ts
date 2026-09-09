export const AppErrorCode = {
  Default: 'app_error',
  UserAlreadySubscribed: 'user_already_subscribed',
  SubscriptionsClosed: 'subscriptions_closed',
  // The caller is authenticated but this particular record is not theirs to
  // touch. Distinct from the token-level checks in `fastifyRequirePermission`,
  // which cannot see the data an authorization decision depends on.
  Forbidden: 'forbidden',
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
