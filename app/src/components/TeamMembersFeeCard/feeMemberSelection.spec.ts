import { describe, expect, it } from 'vitest'
import {
  getPendingMemberIds,
  isAllPendingSelected,
  toggleMemberSelection,
  toggleSelectAllPending,
} from './feeMemberSelection'
import { buildMemberFeeRow, mixedMemberFeeRows } from './feeMemberMocks'

const allPaidRows = [
  buildMemberFeeRow({ userId: 'a', name: 'Ana Lima', status: 'paid' }),
  buildMemberFeeRow({ userId: 'b', name: 'Bruno Reis', status: 'paid' }),
]

describe('getPendingMemberIds', () => {
  it('returns only the ids of members who have not paid', () => {
    expect(getPendingMemberIds(mixedMemberFeeRows)).toEqual(['u-3', 'u-5', 'u-7'])
  })

  it('returns an empty list for a fully settled team', () => {
    expect(getPendingMemberIds(allPaidRows)).toEqual([])
  })
})

describe('isAllPendingSelected', () => {
  it('returns false for a team with no pending members rather than being vacuously true', () => {
    expect(isAllPendingSelected(allPaidRows, [])).toBe(false)
  })

  it('returns true when every pending member is selected', () => {
    expect(isAllPendingSelected(mixedMemberFeeRows, ['u-3', 'u-5', 'u-7'])).toBe(true)
  })

  it('returns false when only some pending members are selected', () => {
    expect(isAllPendingSelected(mixedMemberFeeRows, ['u-3'])).toBe(false)
  })

  it('returns false when nothing is selected', () => {
    expect(isAllPendingSelected(mixedMemberFeeRows, [])).toBe(false)
  })
})

describe('toggleSelectAllPending', () => {
  it('selects every pending member when none are selected', () => {
    expect(toggleSelectAllPending(mixedMemberFeeRows, [])).toEqual(['u-3', 'u-5', 'u-7'])
  })

  it('selects every pending member when only some are selected', () => {
    expect(toggleSelectAllPending(mixedMemberFeeRows, ['u-5'])).toEqual(['u-3', 'u-5', 'u-7'])
  })

  it('clears the selection when every pending member is already selected', () => {
    expect(toggleSelectAllPending(mixedMemberFeeRows, ['u-3', 'u-5', 'u-7'])).toEqual([])
  })

  it('never selects a member who has already paid', () => {
    const selected = toggleSelectAllPending(mixedMemberFeeRows, [])
    const paidIds = mixedMemberFeeRows
      .filter((row) => row.status === 'paid')
      .map((row) => row.userId)

    expect(selected.some((id) => paidIds.includes(id))).toBe(false)
  })

  it('stays empty for a team with nothing left to confirm', () => {
    expect(toggleSelectAllPending(allPaidRows, [])).toEqual([])
  })
})

describe('toggleMemberSelection', () => {
  it('adds a member who is not yet selected', () => {
    expect(toggleMemberSelection(['u-3'], 'u-5')).toEqual(['u-3', 'u-5'])
  })

  it('removes a member who is already selected', () => {
    expect(toggleMemberSelection(['u-3', 'u-5'], 'u-3')).toEqual(['u-5'])
  })

  it('does not mutate the selection it was given', () => {
    const selected = ['u-3']

    toggleMemberSelection(selected, 'u-5')

    expect(selected).toEqual(['u-3'])
  })
})
