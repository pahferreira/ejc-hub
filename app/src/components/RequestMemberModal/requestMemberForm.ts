import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'

export type RequestMemberFormState = {
  message: string
  isSaving?: boolean
}

/**
 * Whether "Enviar solicitação" does anything.
 *
 * `message` is required by the UI even though the API leaves it optional (plan
 * G.1): a reason is what turns "solicitar" into something an admin can act on,
 * so the button stays inert until one is typed — whitespace does not count.
 *
 * The cap is checked against the raw length, not the trimmed one, so it agrees
 * with the `0/400` counter beside the field: the counter turns red the moment
 * typing crosses 400, and the button must go inert at the same instant rather
 * than staying enabled until the trailing whitespace is also trimmed away.
 */
export function canSubmitRequest(state: RequestMemberFormState): boolean {
  if (state.isSaving) {
    return false
  }

  if (state.message.length > MEMBER_REQUEST_MESSAGE_MAX) {
    return false
  }

  return state.message.trim().length > 0
}
