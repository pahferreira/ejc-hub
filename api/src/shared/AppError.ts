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
  // The request is well-formed but its values break a rule the schema cannot
  // express (a date outside the event, say). Answers 400.
  Validation: 'validation',
  // The request would duplicate something that must be unique (a second
  // schedule day on one date). Answers 409.
  Conflict: 'conflict',
  // A schedule activity has left `planned` (started, done or skipped), so its
  // planned day, start and duration are fixed and it can't be deleted. Answers
  // 400; the app maps it to its own pt-BR message.
  ScheduleActivityLocked: 'schedule_activity_locked',
  // A schedule day holds an activity that has left `planned`, so the day can be
  // neither moved to another date nor deleted. Answers 400; the app maps it to
  // its own pt-BR message.
  ScheduleDayLocked: 'schedule_day_locked',
  // An undo of a schedule activity's clock refused by one of its rules. Each
  // answers 400 like `Validation`, with its own code so the app can say why:
  // the activity is planned (nothing to undo), a reopen of an activity that
  // isn't the latest finished, a reopen while another activity runs, or an
  // undo of a skip once a later activity of the day has started.
  ScheduleNothingToUndo: 'schedule_nothing_to_undo',
  ScheduleReopenNotLatest: 'schedule_reopen_not_latest',
  ScheduleReopenWhileRunning: 'schedule_reopen_while_running',
  ScheduleUndoSkipAfterLaterStart: 'schedule_undo_skip_after_later_start',
  // There is no current event to scope the request to. The app maps this code
  // to its own pt-BR message.
  NoCurrentEvent: 'no_current_event',
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
