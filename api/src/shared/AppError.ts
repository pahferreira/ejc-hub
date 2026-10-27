export const AppErrorCode = {
  Default: 'app_error',
  UserAlreadySubscribed: 'user_already_subscribed',
  SubscriptionsClosed: 'subscriptions_closed',
  // The caller is authenticated but this particular record is not theirs to
  // touch. Distinct from the token-level checks in `fastifyRequirePermission`,
  // which cannot see the data an authorization decision depends on.
  Forbidden: 'forbidden',
  // The record the request names does not exist, or not where the caller is
  // looking for it.
  NotFound: 'not_found',
  // The person already holds a team membership in the event, so placing them
  // again is impossible. Raised from a unique violation rather than a
  // read-then-write check, because a concurrent approval can slip between the
  // two. The app maps this code to its own pt-BR message.
  MemberAlreadyAssigned: 'member_already_assigned',
  // Something the code did not anticipate went wrong. The response carries
  // only this code and a generic message; the details go to the server log.
  InternalError: 'internal_error',
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
