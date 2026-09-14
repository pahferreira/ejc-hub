import type { TeamMemberFeeRow } from '../../services/finance/finance.types'

/**
 * How a member is named in the confirmation dialog.
 *
 * The nickname alone is what the table shows and what a coordinator recognises,
 * but it is not unique — three people can be "Ju". The full name disambiguates,
 * and is dropped when it adds nothing (someone with no nickname on file, whose
 * nickname is already their first name, would otherwise read "Maria (Maria)").
 */
export function formatMemberFeeLabel(member: TeamMemberFeeRow): string {
  return member.nickname === member.name ? member.name : `${member.nickname} (${member.name})`
}

/**
 * The labels for a set of selected ids, in the order the rows are listed.
 *
 * Driven from `rows` rather than from `selectedIds` so the dialog lists people
 * in the order they appear on screen, and so an id with no matching row — a
 * selection left over from a page that has since changed — is silently dropped
 * instead of rendering "undefined".
 */
export function formatSelectedMemberLabels(
  rows: TeamMemberFeeRow[],
  selectedIds: string[]
): string[] {
  const selected = new Set(selectedIds)

  return rows.filter((row) => selected.has(row.userId)).map(formatMemberFeeLabel)
}
