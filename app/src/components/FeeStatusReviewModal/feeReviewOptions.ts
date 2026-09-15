import type { MemberFeePaymentStatus } from '../../services/finance/finance.types'

/**
 * The statuses the review dialog can set.
 *
 * `pending` is missing on purpose, and it is not an oversight: "pendente" is
 * what a member *is* before anyone records anything, not a decision a treasurer
 * makes. Reversing a confirmation is `not_paid` — a recorded judgement that the
 * money did not come in — which is why the option reads "Marcar como não pago".
 */
export type ReviewableFeeStatus = Extract<MemberFeePaymentStatus, 'paid' | 'exempt' | 'not_paid'>

export type FeeReviewOption = {
  value: ReviewableFeeStatus
  title: string
  description: string
}

/**
 * In decision order, not enum order: confirming a payment is what a treasurer
 * opens this dialog for nine times out of ten, comping is the deliberate
 * exception, and reverting is the correction.
 */
export const FEE_REVIEW_OPTIONS: FeeReviewOption[] = [
  {
    value: 'paid',
    title: 'Confirmar pagamento',
    description: 'A taxa de inscrição foi recebida.',
  },
  {
    value: 'exempt',
    title: 'Isentar taxa',
    description: 'O membro está dispensado do pagamento.',
  },
  {
    value: 'not_paid',
    title: 'Marcar como não pago',
    description: 'Reverte para pendente de pagamento.',
  },
]

/**
 * Which option a member's current status opens on.
 *
 * `null` for a member who is merely `pending` — nobody has recorded anything for
 * them, so no option is true yet and preselecting one would put words in the
 * treasurer's mouth. That is also the case where `Salvar` starts enabled the
 * moment any option is picked, since every option is a change from "nothing
 * recorded".
 */
export function toInitialReviewSelection(
  current: MemberFeePaymentStatus | undefined | null
): ReviewableFeeStatus | null {
  return FEE_REVIEW_OPTIONS.find((option) => option.value === current)?.value ?? null
}

export type FeeStatusReviewSaveState = {
  /** The member's stored status, or null when the dialog has no member. */
  current: MemberFeePaymentStatus | null
  selected: ReviewableFeeStatus | null
  isSaving?: boolean
}

/**
 * Whether `Salvar` does anything.
 *
 * Three ways it does not, all of which the mock shows as a disabled button: no
 * member to write to, a selection that matches what is already stored (the
 * dialog opens in exactly this state), and a write already in flight. The
 * no-change rule is the load-bearing one — re-sending the current status would
 * be a silent no-op write that still restamps `recordedBy` and `updatedAt`, so
 * an audit trail would show a change nobody made.
 */
export function canSaveFeeStatusReview(state: FeeStatusReviewSaveState): boolean {
  if (state.isSaving || state.current === null || state.selected === null) {
    return false
  }

  return state.selected !== state.current
}
