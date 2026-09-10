import { describe, expect, it } from 'vitest'
import { formatMemberFeeLabel, formatSelectedMemberLabels } from './memberFeeLabels'
import { buildEventFeeMemberRow } from '../../components/TeamMembersFeeCard/feeMemberMocks'

describe('formatMemberFeeLabel', () => {
  it('pairs the nickname with the full name', () => {
    const member = buildEventFeeMemberRow({
      userId: 'u-1',
      name: 'Maria Silva',
      nickname: 'Mari',
    })

    expect(formatMemberFeeLabel(member)).toBe('Mari (Maria Silva)')
  })

  it('shows the name once when the nickname is the same string', () => {
    const member = buildEventFeeMemberRow({
      userId: 'u-1',
      name: 'Madonna',
      nickname: 'Madonna',
    })

    expect(formatMemberFeeLabel(member)).toBe('Madonna')
  })
})

describe('formatSelectedMemberLabels', () => {
  const rows = [
    buildEventFeeMemberRow({ userId: 'u-1', name: 'Maria Silva', nickname: 'Mari' }),
    buildEventFeeMemberRow({ userId: 'u-2', name: 'João Santos', nickname: 'Joca' }),
    buildEventFeeMemberRow({ userId: 'u-3', name: 'Lucas Andrade', nickname: 'Luquinhas' }),
  ]

  it('labels the selected members in the order they are listed', () => {
    // Selection given back to front; the dialog still reads top to bottom.
    expect(formatSelectedMemberLabels(rows, ['u-3', 'u-1'])).toEqual([
      'Mari (Maria Silva)',
      'Luquinhas (Lucas Andrade)',
    ])
  })

  it('drops an id with no row on screen rather than rendering a gap', () => {
    expect(formatSelectedMemberLabels(rows, ['u-1', 'gone'])).toEqual(['Mari (Maria Silva)'])
  })

  it('returns nothing for an empty selection', () => {
    expect(formatSelectedMemberLabels(rows, [])).toEqual([])
  })
})
