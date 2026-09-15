import { describe, it, expect } from 'vitest'
import {
  canSaveFeeStatusReview,
  FEE_REVIEW_OPTIONS,
  toInitialReviewSelection,
} from './feeReviewOptions'

describe('FEE_REVIEW_OPTIONS', () => {
  it('offers exactly the three decisions a treasurer makes', () => {
    expect(FEE_REVIEW_OPTIONS.map((option) => option.value)).toEqual(['paid', 'exempt', 'not_paid'])
  })

  it('never offers pending, which is a state rather than a decision', () => {
    expect(FEE_REVIEW_OPTIONS.map((option) => option.value)).not.toContain('pending')
  })
})

describe('toInitialReviewSelection', () => {
  it.each(['paid', 'exempt', 'not_paid'] as const)('opens on the stored %s status', (status) => {
    expect(toInitialReviewSelection(status)).toBe(status)
  })

  it('preselects nothing for a member with nothing recorded yet', () => {
    expect(toInitialReviewSelection('pending')).toBeNull()
  })

  it('preselects nothing when there is no member', () => {
    expect(toInitialReviewSelection(null)).toBeNull()
    expect(toInitialReviewSelection(undefined)).toBeNull()
  })
})

describe('canSaveFeeStatusReview', () => {
  it('refuses the selection the dialog opened on', () => {
    // The mock's default state: a paid member, "Confirmar pagamento" selected,
    // "Salvar" greyed out.
    expect(canSaveFeeStatusReview({ current: 'paid', selected: 'paid' })).toBe(false)
  })

  it('allows a selection that differs from what is stored', () => {
    expect(canSaveFeeStatusReview({ current: 'paid', selected: 'exempt' })).toBe(true)
  })

  it('allows any option for a member with nothing recorded yet', () => {
    // No option matches `pending`, so the dialog opens with none selected and
    // the first click is already a change.
    expect(canSaveFeeStatusReview({ current: 'pending', selected: 'not_paid' })).toBe(true)
    expect(canSaveFeeStatusReview({ current: 'pending', selected: 'paid' })).toBe(true)
  })

  it('refuses while nothing is selected', () => {
    expect(canSaveFeeStatusReview({ current: 'pending', selected: null })).toBe(false)
  })

  it('refuses while a write is in flight, so it cannot be double-sent', () => {
    expect(canSaveFeeStatusReview({ current: 'paid', selected: 'exempt', isSaving: true })).toBe(
      false
    )
  })

  it('refuses when there is no member to write to', () => {
    expect(canSaveFeeStatusReview({ current: null, selected: 'paid' })).toBe(false)
  })
})
