import { MEMBER_REQUEST_MESSAGE_MAX } from '../../../../common/member-requests'

export type DenyRequestFormState = {
  reason: string
  isSaving?: boolean
}

/**
 * Whether "Negar solicitação" does anything.
 *
 * The reason is required by the UI even though the API leaves it optional
 * (plan D11 shares the cap but not the requirement): a denial the coordinator
 * cannot understand is the one thing this screen must not produce. Whitespace
 * does not count.
 *
 * The cap is checked against the raw length, not the trimmed one, so the button
 * goes inert at the same instant the `0/400` counter beside the field turns red
 * — rather than staying enabled until trailing whitespace is also trimmed away.
 * Mirrors `canSubmitRequest` on the coordinator side.
 */
export function canSubmitDenial(state: DenyRequestFormState): boolean {
  if (state.isSaving) {
    return false
  }

  if (state.reason.length > MEMBER_REQUEST_MESSAGE_MAX) {
    return false
  }

  return state.reason.trim().length > 0
}

/**
 * What denying this request leaves behind for the member.
 *
 * Three separate branches rather than one template with a `pluralize()` call:
 * "sem outras" is not the zero case of "com N", and the singular/plural switch
 * moves *equipe → equipes* as well as the verb. `pluralize` is right for the
 * `+ N equipe(s)` pill, where it genuinely is one word.
 */
export function denyImpactMessage(otherPendingCount: number): string {
  if (otherPendingCount <= 0) {
    return 'O membro continuará na lista de espera sem outras solicitações pendentes.'
  }

  if (otherPendingCount === 1) {
    return 'O membro continuará na lista de espera com 1 solicitação pendente de outra equipe.'
  }

  return `O membro continuará na lista de espera com ${otherPendingCount} solicitações pendentes de outras equipes.`
}
