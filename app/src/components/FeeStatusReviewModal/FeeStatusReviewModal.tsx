import { useEffect, useId, useState } from 'react'
import clsx from 'clsx'
import { FiCheckCircle, FiGift, FiXCircle } from 'react-icons/fi'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import { TeamAvatar } from '../TeamAvatar/TeamAvatar'
import { MemberFeeStatusPill } from '../TeamMembersFeeCard/MemberFeeStatusPill'
import {
  canSaveFeeStatusReview,
  FEE_REVIEW_OPTIONS,
  toInitialReviewSelection,
  type ReviewableFeeStatus,
} from './feeReviewOptions'
import type { EventFeeMemberRow } from '../../services/finance/finance.types'

export type FeeStatusReviewModalProps = {
  open: boolean
  /**
   * Who is under review, or `null` while the dialog is closing. Held by the
   * caller rather than copied in, so a row whose status changes under an open
   * dialog (a refetch after someone else's write) reopens on the new truth
   * instead of saving against a stale one.
   */
  member: EventFeeMemberRow | null
  onClose: () => void
  onSave: (status: ReviewableFeeStatus) => void
  /** Disables the whole dialog while the write is in flight. */
  isSaving?: boolean
}

const optionIcons: Record<ReviewableFeeStatus, typeof FiCheckCircle> = {
  paid: FiCheckCircle,
  exempt: FiGift,
  not_paid: FiXCircle,
}

/**
 * How a card reads once it is the chosen outcome.
 *
 * The same vocabulary `MemberFeeStatusPill` already speaks — green for the two
 * statuses that settle a fee, red for the one that puts it back outstanding — so
 * the card a treasurer is about to save matches the pill they will see on the
 * row afterwards. Unselected cards stay neutral: the colour is here to state the
 * decision, not to label the options before one is made.
 */
const selectedTone: Record<ReviewableFeeStatus, { card: string; icon: string; radio: string }> = {
  paid: {
    card: 'border-green bg-green/10',
    icon: 'bg-green/20 text-green',
    radio: 'checked:border-green',
  },
  exempt: {
    card: 'border-green bg-green/10',
    icon: 'bg-green/20 text-green',
    radio: 'checked:border-green',
  },
  not_paid: {
    card: 'border-red bg-red/10',
    icon: 'bg-red/20 text-red',
    radio: 'checked:border-red',
  },
}

/**
 * Reviews one member's event fee.
 *
 * Replaces the one-way "confirmar pagamento" the row used to offer: every status
 * a treasurer can set is reachable from here, including from a row that already
 * reads as settled — correcting a mistaken confirmation and comping someone are
 * exactly the cases the old action had no answer for.
 *
 * Deliberately single-member. The bulk bar keeps its own confirm-as-paid dialog:
 * this one is built around one person's identity and current standing, which is
 * the context that makes "não pago" a safe thing to offer at all.
 */
export function FeeStatusReviewModal(props: FeeStatusReviewModalProps) {
  const groupName = useId()
  const [selected, setSelected] = useState<ReviewableFeeStatus | null>(null)

  const currentStatus = props.member?.paymentStatus ?? null
  const memberId = props.member?.userId

  // Keyed on the member and their stored status rather than the row object: the
  // list refetches on a timer and would otherwise reset a half-made choice on
  // every poll that changed nothing.
  useEffect(() => {
    setSelected(toInitialReviewSelection(currentStatus))
  }, [memberId, currentStatus, props.open])

  const canSave = canSaveFeeStatusReview({
    current: currentStatus,
    selected,
    isSaving: props.isSaving,
  })

  const handleSave = () => {
    if (!canSave || !selected) {
      return
    }

    props.onSave(selected)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Revisar taxa">
      {props.member && (
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-1">
            <h3 className="m-0 font-serif text-2xl text-dark-brown">{props.member.nickname}</h3>
            <span className="text-sm text-secondary-foreground">{props.member.name}</span>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Decorative: the team name sits right beside it. */}
              <span aria-hidden="true">
                <TeamAvatar name={props.member.teamName} size="sm" />
              </span>
              <span className="text-sm font-medium text-dark-brown">{props.member.teamName}</span>
              {/* The stored status, not the folded one the table shows: telling
                  "Isento" from "Pago" is the point of reviewing. */}
              <MemberFeeStatusPill status={props.member.paymentStatus} />
            </div>
          </header>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" disabled={props.isSaving}>
            <legend className="sr-only">Novo status da taxa</legend>

            {FEE_REVIEW_OPTIONS.map((option) => {
              const Icon = optionIcons[option.value]
              const tone = selectedTone[option.value]
              const isSelected = selected === option.value

              return (
                <label
                  key={option.value}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors',
                    isSelected ? tone.card : 'border-tertiary bg-white hover:bg-tertiary/30'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      isSelected ? tone.icon : 'bg-tertiary/50 text-dark-brown'
                    )}
                  >
                    <Icon size={18} />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-dark-brown">{option.title}</span>
                    <span className="text-xs text-secondary-foreground">{option.description}</span>
                  </span>

                  <input
                    type="radio"
                    name={groupName}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setSelected(option.value)}
                    className={clsx(
                      'h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-primary checked:border-4 disabled:cursor-not-allowed',
                      tone.radio
                    )}
                  />
                </label>
              )
            })}
          </fieldset>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={props.onClose} disabled={props.isSaving}>
              Cancelar
            </Button>
            {/* Inert until the selection differs from what is stored: re-sending
                the current status writes nothing a treasurer would recognise,
                but still restamps who recorded it and when. */}
            <Button onClick={handleSave} disabled={!canSave}>
              {props.isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
